/**
 * Strategy engine for the SaleADS-style campaign flow.
 *
 * Takes the operator's plain-language campaign brief and returns one
 * recommended strategy plus alternatives, the campaign structure to build,
 * and — the part that matters most — an explicit list of facts the brief is
 * still missing, each marked blocking or not.
 *
 * Hard rules (see CLAUDE.md):
 *   - It never invents a commercial fact. If the brief has no price, the
 *     strategy says the price is missing; it does not guess one.
 *   - Budget thresholds here are OUR operating heuristics for deciding
 *     whether a plan is worth launching. They are not figures published by
 *     Meta and must never be presented to a client as such.
 *
 * Pure and synchronous: no database, no network, no provider SDK. That keeps
 * it fully testable and lets the UI re-run it on every keystroke.
 */
import { destination, type DestinationId } from "@/lib/catalog/destinations";
import type { ObjectiveId } from "@/lib/catalog/objectives";

export type CampaignBriefInput = {
  /** Plain language: what is being sold, in the operator's own words. */
  offerSummary: string;
  priceDisplay: string | null;
  benefits: string[];
  /** Conditions, exclusions, stock limits, validity. */
  restrictions: string | null;
  destinationId: DestinationId;
  whatsappNumber: string | null;
  landingUrl: string | null;
  phoneNumber: string | null;
  countries: string[];
  cities: string[];
  radiusKm: number | null;
  language: string | null;
  audienceNotes: string | null;
  /** USD. One of the two budgets is enough. */
  dailyBudgetUsd: number | null;
  lifetimeBudgetUsd: number | null;
  durationDays: number | null;
};

export type MissingInfo = {
  field: string;
  label: string;
  /** Why the campaign needs it — shown to the operator verbatim. */
  why: string;
  /** true = cannot publish until it is provided. */
  blocking: boolean;
};

export type StrategyOption = {
  id: string;
  label: string;
  metaObjective: string;
  destinationId: DestinationId;
  structure: { adSets: number; adsPerAdSet: number; totalAds: number };
  audience: { geo: string; language: string | null; notes: string | null };
  /** Why this plan fits the brief. */
  rationale: string;
  /** What it costs you to choose it. Stated so the choice is informed. */
  tradeoff: string;
};

export type BudgetAssessment = {
  dailyUsd: number | null;
  durationDays: number | null;
  totalUsd: number | null;
  /** Our floor for this objective, per ad set, per day. A heuristic. */
  floorPerAdSetUsd: number;
  adSets: number;
  verdict: "SIN_PRESUPUESTO" | "POR_DEBAJO_DEL_MINIMO" | "AJUSTADO" | "SUFICIENTE";
  message: string;
};

export type StrategyRecommendation = {
  recommended: StrategyOption;
  alternatives: StrategyOption[];
  missingInfo: MissingInfo[];
  budget: BudgetAssessment;
  /** No blocking gaps: the draft may be published. */
  readyToPublish: boolean;
};

/**
 * Our minimum daily spend per ad set, in USD, by objective. Objectives that
 * optimize for a conversion event need more daily volume before Meta can
 * learn, so they carry a higher floor than reach-style objectives.
 * Heuristics, not Meta documentation.
 */
const DAILY_FLOOR_PER_AD_SET_USD: Record<ObjectiveId, number> = {
  VENDER: 10,
  LEADS: 8,
  MENSAJES: 5,
  PROMOCIONAR: 5,
  LANZAMIENTO: 5,
  RECONOCIMIENTO: 3,
};

function geoLabel(brief: CampaignBriefInput): string {
  const cities = brief.cities.filter((c) => c.trim());
  const countries = brief.countries.filter((c) => c.trim());
  if (cities.length) {
    const radius = brief.radiusKm ? ` (+${brief.radiusKm} km)` : "";
    return `${cities.join(", ")}${radius}`;
  }
  if (countries.length) return countries.join(", ");
  return "sin definir";
}

/** One ad set per city keeps spend and reporting separable; a country-wide
 *  brief runs as a single ad set. */
function adSetCount(brief: CampaignBriefInput): number {
  const cities = brief.cities.filter((c) => c.trim());
  return cities.length > 1 ? cities.length : 1;
}

export function assessBudget(
  brief: CampaignBriefInput,
  objective: ObjectiveId,
  adSets: number
): BudgetAssessment {
  const floor = DAILY_FLOOR_PER_AD_SET_USD[objective];
  const duration = brief.durationDays;
  let daily = brief.dailyBudgetUsd;
  if (daily == null && brief.lifetimeBudgetUsd != null && duration && duration > 0) {
    daily = brief.lifetimeBudgetUsd / duration;
  }
  const total =
    brief.lifetimeBudgetUsd ?? (daily != null && duration ? daily * duration : null);
  const needed = floor * adSets;

  if (daily == null) {
    return {
      dailyUsd: null,
      durationDays: duration,
      totalUsd: total,
      floorPerAdSetUsd: floor,
      adSets,
      verdict: "SIN_PRESUPUESTO",
      message: "Falta el presupuesto. Sin él no se puede dimensionar la campaña.",
    };
  }
  const rounded = Math.round(daily * 100) / 100;
  if (daily < needed) {
    return {
      dailyUsd: rounded,
      durationDays: duration,
      totalUsd: total,
      floorPerAdSetUsd: floor,
      adSets,
      verdict: "POR_DEBAJO_DEL_MINIMO",
      message:
        `$${rounded}/día repartidos en ${adSets} conjunto(s) quedan por debajo de ` +
        `nuestro mínimo de $${floor}/día por conjunto para el objetivo ${objective}. ` +
        `Sube a $${needed}/día o reduce a menos ciudades.`,
    };
  }
  if (daily < needed * 1.5) {
    return {
      dailyUsd: rounded,
      durationDays: duration,
      totalUsd: total,
      floorPerAdSetUsd: floor,
      adSets,
      verdict: "AJUSTADO",
      message:
        `$${rounded}/día cubre el mínimo de $${needed}/día, pero sin margen. ` +
        `Espera aprendizaje lento y resultados inestables los primeros días.`,
    };
  }
  return {
    dailyUsd: rounded,
    durationDays: duration,
    totalUsd: total,
    floorPerAdSetUsd: floor,
    adSets,
    verdict: "SUFICIENTE",
    message: `$${rounded}/día es suficiente para ${adSets} conjunto(s) con este objetivo.`,
  };
}

export function findMissingInfo(
  brief: CampaignBriefInput,
  objective: ObjectiveId
): MissingInfo[] {
  const missing: MissingInfo[] = [];
  const dest = destination(brief.destinationId);

  if (!brief.offerSummary.trim()) {
    missing.push({
      field: "offerSummary",
      label: "Qué se vende",
      why: "Sin la oferta en palabras del negocio no hay nada que anunciar.",
      blocking: true,
    });
  }

  // The destination decides which contact fact is mandatory.
  if (dest.requires === "whatsappNumber" && !brief.whatsappNumber?.trim()) {
    missing.push({
      field: "whatsappNumber",
      label: "Número de WhatsApp",
      why: "El destino es WhatsApp: sin número el anuncio no lleva a ningún lado.",
      blocking: true,
    });
  }
  if (dest.requires === "landingUrl" && !brief.landingUrl?.trim()) {
    missing.push({
      field: "landingUrl",
      label: "Enlace de destino",
      why: "El destino es un sitio web: hace falta la URL exacta.",
      blocking: true,
    });
  }
  if (dest.requires === "phoneNumber" && !brief.phoneNumber?.trim()) {
    missing.push({
      field: "phoneNumber",
      label: "Teléfono",
      why: "El destino es una llamada: hace falta el número.",
      blocking: true,
    });
  }

  if (!brief.countries.some((c) => c.trim()) && !brief.cities.some((c) => c.trim())) {
    missing.push({
      field: "geo",
      label: "Dónde anunciar",
      why: "Sin país ni ciudad la campaña no se puede segmentar.",
      blocking: true,
    });
  }

  if (brief.dailyBudgetUsd == null && brief.lifetimeBudgetUsd == null) {
    missing.push({
      field: "budget",
      label: "Presupuesto",
      why: "Sin presupuesto no se puede publicar ni estimar alcance.",
      blocking: true,
    });
  }

  if (brief.lifetimeBudgetUsd != null && !brief.durationDays) {
    missing.push({
      field: "durationDays",
      label: "Duración",
      why: "Con presupuesto total hace falta saber en cuántos días se gasta.",
      blocking: true,
    });
  }

  // Non-blocking: the campaign can run, but the copy will be weaker and the
  // engines will have to leave these out rather than invent them.
  if (objective === "VENDER" && !brief.priceDisplay?.trim()) {
    missing.push({
      field: "priceDisplay",
      label: "Precio",
      why: "El objetivo es vender. Sin precio el copy no puede mencionarlo y no se inventará.",
      blocking: false,
    });
  }
  if (!brief.benefits.some((b) => b.trim())) {
    missing.push({
      field: "benefits",
      label: "Beneficios",
      why: "Sin beneficios los anuncios se quedan en describir, no en persuadir.",
      blocking: false,
    });
  }
  if (!brief.audienceNotes?.trim()) {
    missing.push({
      field: "audienceNotes",
      label: "A quién le sirve",
      why: "Ayuda a elegir intereses y a redactar para esa persona.",
      blocking: false,
    });
  }
  if (!brief.restrictions?.trim()) {
    missing.push({
      field: "restrictions",
      label: "Condiciones y vigencia",
      why: "Evita prometer lo que el negocio no puede cumplir.",
      blocking: false,
    });
  }

  return missing;
}

function option(
  id: string,
  label: string,
  destinationId: DestinationId,
  brief: CampaignBriefInput,
  adSets: number,
  adsPerAdSet: number,
  rationale: string,
  tradeoff: string
): StrategyOption {
  return {
    id,
    label,
    metaObjective: destination(destinationId).metaObjective,
    destinationId,
    structure: { adSets, adsPerAdSet, totalAds: adSets * adsPerAdSet },
    audience: {
      geo: geoLabel(brief),
      language: brief.language?.trim() || null,
      notes: brief.audienceNotes?.trim() || null,
    },
    rationale,
    tradeoff,
  };
}

/**
 * The recommendation. Deterministic: the same brief always yields the same
 * plan, so the operator can trust that editing one field changed one thing.
 */
export function recommendStrategy(
  brief: CampaignBriefInput,
  objective: ObjectiveId
): StrategyRecommendation {
  const adSets = adSetCount(brief);
  const missingInfo = findMissingInfo(brief, objective);
  const budget = assessBudget(brief, objective, adSets);
  const chosen = brief.destinationId;

  const recommended = option(
    "principal",
    `${destination(chosen).label} · ${adSets} conjunto(s) × 3 anuncios`,
    chosen,
    brief,
    adSets,
    3,
    `Respeta el destino que elegiste (${destination(chosen).label}) y abre tres ` +
      `ángulos distintos por conjunto, que es el mínimo para comparar creatividades ` +
      `sin dispersar el presupuesto.`,
    adSets > 1
      ? `Un conjunto por ciudad separa el gasto y el reporte, pero divide el ` +
        `aprendizaje: cada conjunto aprende por su cuenta.`
      : `Un solo conjunto concentra el aprendizaje, pero no te dirá qué ciudad rinde mejor.`
  );

  const alternatives: StrategyOption[] = [];

  // A cheaper conversation-first alternative when the brief aims to sell.
  if (chosen !== "WHATSAPP" && (objective === "VENDER" || objective === "LEADS")) {
    alternatives.push(
      option(
        "conversacion",
        "WhatsApp · 1 conjunto × 3 anuncios",
        "WHATSAPP",
        brief,
        1,
        3,
        `Llevar a conversación suele costar menos por contacto que pedir una ` +
          `acción en un sitio, y deja que el negocio cierre la venta a mano.`,
        `Exige a alguien contestando los chats. Si nadie responde, el dinero se pierde.`
      )
    );
  }

  // A consolidated alternative when the city split would starve the budget.
  if (adSets > 1 && budget.verdict === "POR_DEBAJO_DEL_MINIMO") {
    alternatives.push(
      option(
        "consolidado",
        `${destination(chosen).label} · 1 conjunto × 3 anuncios`,
        chosen,
        brief,
        1,
        3,
        `Con el presupuesto actual, un único conjunto que cubra todas las ciudades ` +
          `sí alcanza el mínimo diario.`,
        `Pierdes la lectura por ciudad: no sabrás dónde rinde mejor.`
      )
    );
  }

  // A reach-first alternative for a brand-new offer with little to say yet.
  if (objective === "LANZAMIENTO" || objective === "RECONOCIMIENTO") {
    alternatives.push(
      option(
        "alcance",
        "Perfil de la marca · 1 conjunto × 3 anuncios",
        "PERFIL",
        brief,
        1,
        3,
        `Para algo que nadie conoce todavía, comprar alcance barato y medir ` +
          `interés sale más económico que optimizar a una conversión que aún no ocurre.`,
        `No genera ventas ni contactos de forma directa.`
      )
    );
  }

  return {
    recommended,
    alternatives,
    missingInfo,
    budget,
    readyToPublish: !missingInfo.some((m) => m.blocking),
  };
}
