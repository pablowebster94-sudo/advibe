/**
 * The boundary between this app and Meta's Marketing API.
 *
 * Nothing in the product talks to Meta except through here, so that:
 *   - route handlers never touch the Graph API directly (see CLAUDE.md);
 *   - credentials are read from process.env in exactly one place;
 *   - and, while Meta is not connected, the app can still say precisely what
 *     is missing instead of failing with a generic error.
 *
 * Publishing itself is deliberately not implemented yet: it needs a Meta
 * developer app, an OAuth-authorized token with ads_management/ads_read, and
 * a test ad account. Until those exist, publish() refuses loudly rather than
 * pretending to have published. Draft generation never depends on this.
 */
import { destination, type DestinationId } from "@/lib/catalog/destinations";

export type MetaRequirement = {
  key: string;
  label: string;
  /** What the operator has to do to supply it. */
  how: string;
};

export type MetaConfiguration = {
  configured: boolean;
  missing: MetaRequirement[];
};

/** Credentials every publish needs, whatever the destination. */
const BASE_REQUIREMENTS: MetaRequirement[] = [
  {
    key: "META_SYSTEM_USER_TOKEN",
    label: "Token de usuario de sistema",
    how: "Crear una app en Meta for Developers con el producto Marketing API y generar un token con permisos ads_management y ads_read.",
  },
  {
    key: "META_AD_ACCOUNT_ID",
    label: "Cuenta publicitaria",
    how: "El identificador de la cuenta de anuncios en la que se crearán las campañas.",
  },
  {
    key: "META_PAGE_ID",
    label: "Página de Facebook",
    how: "La página que publica los anuncios. Define de qué cliente es cada anuncio.",
  },
];

/** Extra credentials a particular destination needs. */
function destinationRequirements(destinationId: DestinationId): MetaRequirement[] {
  if (destinationId === "MENSAJES_IG") {
    return [
      {
        key: "META_INSTAGRAM_ACCOUNT_ID",
        label: "Cuenta de Instagram",
        how: "La cuenta de Instagram vinculada a la página, necesaria para anuncios que abren Instagram Direct.",
      },
    ];
  }
  return [];
}

/**
 * Reads the environment and reports what is still missing. Never throws and
 * never returns a secret's value — only whether each one is present.
 */
export function metaConfiguration(destinationId?: DestinationId): MetaConfiguration {
  const required = [
    ...BASE_REQUIREMENTS,
    ...(destinationId ? destinationRequirements(destinationId) : []),
  ];
  const missing = required.filter((r) => !process.env[r.key]?.trim());
  return { configured: missing.length === 0, missing };
}

export class MetaNotConfiguredError extends Error {
  readonly code = "META_NOT_CONFIGURED";
  constructor(readonly missing: MetaRequirement[]) {
    super("La conexión con Meta no está configurada.");
    this.name = "MetaNotConfiguredError";
  }
}

export class MetaNotImplementedError extends Error {
  readonly code = "META_PUBLISH_NOT_IMPLEMENTED";
  constructor() {
    super(
      "Publicar en Meta todavía no está implementado. La campaña queda aprobada y lista para copiarse al administrador de anuncios."
    );
    this.name = "MetaNotImplementedError";
  }
}

export type PublishRequest = {
  campaignId: string;
  destinationId: DestinationId;
  /** Meta objective the strategy chose, e.g. OUTCOME_ENGAGEMENT. */
  metaObjective: string;
  dailyBudgetUsd: number;
  adSets: number;
};

/**
 * Creates the campaign in Meta. Always PAUSED: activating is a separate,
 * explicitly confirmed action, never a side effect of publishing.
 *
 * Throws MetaNotConfiguredError listing exactly what is missing, or
 * MetaNotImplementedError once it is configured but the API calls are not
 * written yet. It never returns a fake success.
 */
export async function publishPausedCampaign(request: PublishRequest): Promise<never> {
  const config = metaConfiguration(request.destinationId);
  if (!config.configured) {
    throw new MetaNotConfiguredError(config.missing);
  }
  // Touch the destination so an unknown id fails here rather than inside a
  // half-built Graph API call.
  destination(request.destinationId);
  throw new MetaNotImplementedError();
}
