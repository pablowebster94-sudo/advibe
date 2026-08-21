/**
 * Advertising objective chosen in step 4. Drives copy tone and which
 * concept angles the analysis engine prioritizes.
 */
export const OBJECTIVES = [
  {
    id: "VENDER",
    label: "Vender",
    description: "Impulsar la compra directa del producto.",
  },
  {
    id: "MENSAJES",
    label: "Generar mensajes",
    description: "Que el usuario escriba por WhatsApp o Messenger.",
  },
  {
    id: "LEADS",
    label: "Generar leads",
    description: "Captar datos de contacto interesados.",
  },
  {
    id: "PROMOCIONAR",
    label: "Promocionar",
    description: "Dar visibilidad a una oferta o promoción vigente.",
  },
  {
    id: "LANZAMIENTO",
    label: "Lanzamiento",
    description: "Anunciar un producto o modelo nuevo.",
  },
  {
    id: "RECONOCIMIENTO",
    label: "Reconocimiento de marca",
    description: "Dar a conocer la marca o el producto, sin foco en venta inmediata.",
  },
] as const;

export type ObjectiveId = (typeof OBJECTIVES)[number]["id"];
