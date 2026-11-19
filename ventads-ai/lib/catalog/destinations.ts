/**
 * Where an ad sends the person who clicks. Chosen in the campaign brief and
 * used by the strategy engine to pick a Meta objective and to decide which
 * facts the brief still needs (a WhatsApp destination needs a number, a
 * website destination needs a URL, and so on).
 *
 * A catalog, not a Prisma enum: new destinations (Telegram, a booking link,
 * a catalog view) must never require a schema change. See CLAUDE.md.
 */
export const DESTINATIONS = [
  {
    id: "WHATSAPP",
    label: "WhatsApp",
    description: "La persona abre un chat de WhatsApp con el negocio.",
    requires: "whatsappNumber",
    metaObjective: "OUTCOME_ENGAGEMENT",
  },
  {
    id: "SITIO_WEB",
    label: "Sitio web",
    description: "La persona entra a una página del negocio.",
    requires: "landingUrl",
    metaObjective: "OUTCOME_TRAFFIC",
  },
  {
    id: "FORMULARIO",
    label: "Formulario instantáneo",
    description: "La persona deja sus datos sin salir de Facebook o Instagram.",
    requires: null,
    metaObjective: "OUTCOME_LEADS",
  },
  {
    id: "MENSAJES_IG",
    label: "Mensajes de Instagram",
    description: "La persona abre un chat en Instagram Direct.",
    requires: null,
    metaObjective: "OUTCOME_ENGAGEMENT",
  },
  {
    id: "LLAMADA",
    label: "Llamada telefónica",
    description: "La persona llama al negocio.",
    requires: "phoneNumber",
    metaObjective: "OUTCOME_LEADS",
  },
  {
    id: "PERFIL",
    label: "Perfil de la marca",
    description: "La persona visita el perfil; sirve para reconocimiento.",
    requires: null,
    metaObjective: "OUTCOME_AWARENESS",
  },
] as const;

export type DestinationId = (typeof DESTINATIONS)[number]["id"];

export function isDestinationId(value: unknown): value is DestinationId {
  return typeof value === "string" && DESTINATIONS.some((d) => d.id === value);
}

export function destination(id: DestinationId) {
  const found = DESTINATIONS.find((d) => d.id === id);
  if (!found) throw new Error(`Unknown destination: ${id}`);
  return found;
}
