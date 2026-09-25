/**
 * Editing strategies.
 *
 * A strategy does not contain slider values. It contains *targets and gains*
 * that the engine applies to what it measured in each individual photo — so two
 * church shots with different exposure still get different corrections while
 * sharing the same intent ("keep the ambience, do not flatten the background").
 *
 * That distinction is what separates this from a preset pack.
 */
import type { SceneTag, WeddingCategory } from "../types";

export interface Strategy {
  id: string;
  label: string;
  /** Spanish, shown in the UI next to each photo. */
  intent: string;

  /**
   * Shifts the acceptable midtone band. Negative keeps a scene darker than the
   * generic target — a candle-lit church is meant to look like one.
   */
  midtoneBias: number;
  /** Target luma standard deviation; the contrast slider aims at this. */
  contrastTarget: number;
  /** 0..1.5 gain on highlight recovery. */
  highlightGain: number;
  /** 0..1.5 gain on shadow lift. */
  shadowGain: number;
  /** How firmly to set the black point. Low values preserve mood. */
  blackPointGain: number;
  /** Gain on the measured white-balance correction. */
  whiteBalanceGain: number;

  baseVibrance: number;
  baseSaturation: number;
  baseClarity: number;
  baseTexture: number;
  /** Applied only when haze is actually measured. */
  dehazeGain: number;
  baseVignette: number;

  /** When true, the skin guard runs with its strict limits. */
  protectSkin: boolean;
  /**
   * Subject-priority weight, 0..1. At 1 the exposure decision is driven by the
   * faces rather than by the whole frame.
   */
  subjectWeight: number;
}

const BASE: Omit<Strategy, "id" | "label" | "intent"> = {
  midtoneBias: 0,
  contrastTarget: 0.2,
  highlightGain: 1,
  shadowGain: 1,
  blackPointGain: 1,
  whiteBalanceGain: 0.8,
  baseVibrance: 8,
  baseSaturation: 0,
  baseClarity: 4,
  baseTexture: 3,
  dehazeGain: 1,
  baseVignette: 0,
  protectSkin: false,
  subjectWeight: 0,
};

export const STRATEGIES: Record<string, Strategy> = {
  general: {
    ...BASE,
    id: "general",
    label: "General",
    intent: "Corrección neutra y equilibrada.",
  },

  portrait: {
    ...BASE,
    id: "portrait",
    label: "Retrato",
    intent: "Prioriza la piel y la exposición del sujeto; claridad contenida.",
    contrastTarget: 0.18,
    highlightGain: 0.9,
    shadowGain: 1.05,
    blackPointGain: 0.85,
    baseVibrance: 10,
    baseClarity: -3,
    baseTexture: 0,
    baseVignette: -8,
    protectSkin: true,
    subjectWeight: 0.75,
  },

  couple: {
    ...BASE,
    id: "couple",
    label: "Pareja",
    intent: "Piel natural en dos sujetos, fondo suave, viñeta discreta.",
    contrastTarget: 0.19,
    highlightGain: 0.95,
    shadowGain: 1.0,
    blackPointGain: 0.9,
    baseVibrance: 10,
    baseClarity: -2,
    baseVignette: -6,
    protectSkin: true,
    subjectWeight: 0.7,
  },

  group: {
    ...BASE,
    id: "group",
    label: "Grupo",
    intent: "Exposición uniforme sobre todos los rostros, sin aplanar el fondo.",
    contrastTarget: 0.2,
    highlightGain: 1.0,
    shadowGain: 1.15,
    baseVibrance: 8,
    baseClarity: 0,
    protectSkin: true,
    subjectWeight: 0.55,
  },

  ceremony: {
    ...BASE,
    id: "ceremony",
    label: "Ceremonia (interior)",
    intent: "Mantiene el ambiente: no levanta el fondo ni abre las sombras del templo.",
    // A church is supposed to read darker than a generic scene.
    midtoneBias: -0.28,
    contrastTarget: 0.22,
    highlightGain: 1.15,
    // The single most important number here: barely open the shadows.
    shadowGain: 0.45,
    blackPointGain: 0.7,
    whiteBalanceGain: 0.6,
    baseVibrance: 6,
    baseClarity: 2,
    baseTexture: 0,
    protectSkin: true,
    subjectWeight: 0.6,
  },

  indoor: {
    ...BASE,
    id: "indoor",
    label: "Interior",
    intent: "Equilibra luz artificial sin blanquear el ambiente.",
    midtoneBias: -0.12,
    shadowGain: 0.8,
    whiteBalanceGain: 0.7,
    baseVibrance: 8,
    protectSkin: true,
    subjectWeight: 0.4,
  },

  outdoor: {
    ...BASE,
    id: "outdoor",
    label: "Exterior",
    intent: "Controla altas luces y preserva el cielo.",
    contrastTarget: 0.21,
    highlightGain: 1.35,
    shadowGain: 1.1,
    baseVibrance: 12,
    baseClarity: 6,
    baseTexture: 5,
    dehazeGain: 1.2,
    subjectWeight: 0.35,
  },

  backlit: {
    ...BASE,
    id: "backlit",
    label: "Contraluz",
    intent: "Recupera el sujeto sin apagar el halo del fondo.",
    contrastTarget: 0.19,
    highlightGain: 1.4,
    shadowGain: 1.45,
    blackPointGain: 0.75,
    baseVibrance: 10,
    baseClarity: 3,
    protectSkin: true,
    // The whole point of a backlit frame is that the meter is wrong about it.
    subjectWeight: 0.85,
  },

  flash: {
    ...BASE,
    id: "flash",
    label: "Flash",
    intent: "Equilibra la luz del flash con la ambiente y frena el brillo en la piel.",
    contrastTarget: 0.18,
    highlightGain: 1.25,
    shadowGain: 1.2,
    blackPointGain: 0.8,
    whiteBalanceGain: 0.65,
    baseVibrance: 8,
    baseClarity: -2,
    protectSkin: true,
    subjectWeight: 0.7,
  },

  night: {
    ...BASE,
    id: "night",
    label: "Nocturna",
    intent: "Conserva la noche: sombras cerradas y ruido bajo control.",
    midtoneBias: -0.35,
    contrastTarget: 0.23,
    highlightGain: 1.1,
    shadowGain: 0.55,
    blackPointGain: 0.6,
    whiteBalanceGain: 0.5,
    baseVibrance: 6,
    baseClarity: 0,
    baseTexture: -4,
    protectSkin: true,
    subjectWeight: 0.5,
  },

  party: {
    ...BASE,
    id: "party",
    label: "Fiesta",
    intent: "Color vivo y noche intacta; las luces de colores no se corrigen.",
    midtoneBias: -0.25,
    contrastTarget: 0.24,
    shadowGain: 0.6,
    blackPointGain: 0.65,
    // Coloured stage lighting is intentional: do not neutralise it.
    whiteBalanceGain: 0.25,
    baseVibrance: 10,
    baseClarity: 2,
    protectSkin: true,
    subjectWeight: 0.45,
  },

  detail: {
    ...BASE,
    id: "detail",
    label: "Detalle",
    intent: "Micro-contraste y textura al máximo útil; sin piel que proteger.",
    contrastTarget: 0.22,
    baseVibrance: 12,
    baseClarity: 12,
    baseTexture: 14,
    baseVignette: -10,
    protectSkin: false,
    subjectWeight: 0,
  },
};

/** Maps a scene tag to its base strategy. */
export function strategyForScene(primary: SceneTag, tags: readonly SceneTag[]): Strategy {
  // Light conditions override subject, because they change what is physically
  // recoverable, which subject-level intent cannot.
  if (tags.includes("night") && tags.includes("flash")) return STRATEGIES.party;
  if (tags.includes("backlit")) return STRATEGIES.backlit;
  if (tags.includes("flash")) return STRATEGIES.flash;
  if (tags.includes("night")) return STRATEGIES.night;

  switch (primary) {
    case "portrait":
      return STRATEGIES.portrait;
    case "couple":
      return STRATEGIES.couple;
    case "group":
      return STRATEGIES.group;
    case "detail":
      return STRATEGIES.detail;
    case "ceremony":
      return STRATEGIES.ceremony;
    case "outdoor":
      return STRATEGIES.outdoor;
    case "indoor":
      return STRATEGIES.indoor;
    default:
      return STRATEGIES.general;
  }
}

/**
 * Wedding mode: the moment refines the strategy chosen from the scene, it does
 * not replace it. A backlit church exit is still a backlit frame.
 */
export function refineForWedding(strategy: Strategy, category: WeddingCategory): Strategy {
  switch (category) {
    case "ceremony":
      return strategy.id === "backlit" || strategy.id === "flash"
        ? { ...strategy, shadowGain: strategy.shadowGain * 0.7, midtoneBias: strategy.midtoneBias - 0.15 }
        : STRATEGIES.ceremony;
    case "church-exit":
      return {
        ...STRATEGIES.backlit,
        id: "church-exit",
        label: "Salida de iglesia",
        intent: "Sujeto recuperado contra la luz de la puerta, sin quemar el exterior.",
        highlightGain: 1.5,
      };
    case "details":
      return STRATEGIES.detail;
    case "dance":
      return {
        ...STRATEGIES.party,
        id: "dance",
        label: "Baile",
        intent: "Movimiento y ambiente: sin intentar salvar el desenfoque de movimiento.",
        baseTexture: -6,
        baseClarity: 0,
      };
    case "preparations":
      return {
        ...strategy,
        id: `${strategy.id}-preparations`,
        label: "Preparativos",
        intent: "Luz de ventana suave, piel limpia, sombras abiertas con moderación.",
        shadowGain: strategy.shadowGain * 1.1,
        baseClarity: Math.min(strategy.baseClarity, -2),
        protectSkin: true,
        subjectWeight: Math.max(strategy.subjectWeight, 0.7),
      };
    case "family":
      return { ...STRATEGIES.group, id: "family", label: "Familia", intent: STRATEGIES.group.intent };
    case "portraits":
      return strategy.id === "portrait" ? strategy : { ...STRATEGIES.portrait, ...pickLight(strategy) };
    case "couple":
      return strategy.id === "couple" ? strategy : { ...STRATEGIES.couple, ...pickLight(strategy) };
    case "reception":
      return {
        ...strategy,
        id: `${strategy.id}-reception`,
        label: "Recepción",
        intent: "Ambiente cálido de salón conservado, piel natural.",
        whiteBalanceGain: Math.min(strategy.whiteBalanceGain, 0.55),
        protectSkin: true,
      };
    case "party":
      return STRATEGIES.party;
    default:
      return strategy;
  }
}

/** Carries the light-dependent parameters across when swapping the subject strategy. */
function pickLight(strategy: Strategy): Partial<Strategy> {
  return {
    midtoneBias: strategy.midtoneBias,
    highlightGain: strategy.highlightGain,
    shadowGain: strategy.shadowGain,
    whiteBalanceGain: strategy.whiteBalanceGain,
  };
}

export const WEDDING_CATEGORY_LABELS: Record<WeddingCategory, string> = {
  preparations: "Preparativos",
  ceremony: "Ceremonia",
  "church-exit": "Salida de iglesia",
  couple: "Pareja",
  family: "Familia",
  portraits: "Retratos",
  reception: "Recepción",
  dance: "Baile",
  party: "Fiesta",
  details: "Detalles",
  unassigned: "Sin clasificar",
};

export const SCENE_LABELS: Record<SceneTag, string> = {
  portrait: "Retrato",
  couple: "Pareja",
  group: "Grupo",
  ceremony: "Ceremonia",
  indoor: "Interior",
  outdoor: "Exterior",
  reception: "Recepción",
  party: "Fiesta",
  detail: "Detalle",
  night: "Nocturna",
  flash: "Flash",
  backlit: "Contraluz",
};
