/**
 * Visual style chosen in step 5. Each entry carries the palette/typography
 * parameters the creative renderer (lib/services/image-generation) reads —
 * adding a new style is one object here, no renderer changes required.
 */
export const STYLES = [
  {
    id: "PREMIUM",
    label: "Premium",
    description: "Oscuro, elegante, tipografía refinada.",
    palette: { background: "#0e0e0c", panel: "#17170f", text: "#f7f6f1", accent: "#c9a24b" },
  },
  {
    id: "COMERCIAL",
    label: "Comercial",
    description: "Directo, alto contraste, foco en precio y CTA.",
    palette: { background: "#12203b", panel: "#16305c", text: "#ffffff", accent: "#ffb800" },
  },
  {
    id: "MINIMALISTA",
    label: "Minimalista",
    description: "Mucho espacio en blanco, tipografía limpia.",
    palette: { background: "#ffffff", panel: "#f4f4f2", text: "#111111", accent: "#111111" },
  },
  {
    id: "MODERNO",
    label: "Moderno",
    description: "Geométrico, gradientes suaves, actual.",
    palette: { background: "#111827", panel: "#1f2937", text: "#ffffff", accent: "#5eead4" },
  },
  {
    id: "LIFESTYLE",
    label: "Lifestyle",
    description: "Cálido, aspiracional, cercano.",
    palette: { background: "#2b2118", panel: "#3a2c1f", text: "#fdf6ec", accent: "#e8905a" },
  },
  {
    id: "URGENCIA",
    label: "Urgencia / Oferta",
    description: "Rojo, energético, pensado para promociones.",
    palette: { background: "#1a0e0e", panel: "#3a1414", text: "#ffffff", accent: "#ff3b30" },
  },
  {
    id: "ELEGANTE",
    label: "Elegante",
    description: "Sobrio, tonos neutros, gran producto.",
    palette: { background: "#1c1c1c", panel: "#262626", text: "#f5f5f5", accent: "#d4d4d4" },
  },
  {
    id: "DEPORTIVO",
    label: "Deportivo",
    description: "Dinámico, diagonales, alto impacto.",
    palette: { background: "#0b1220", panel: "#132038", text: "#ffffff", accent: "#00e0ff" },
  },
] as const;

export type StyleId = (typeof STYLES)[number]["id"];

export function getStyle(id: string) {
  return STYLES.find((style) => style.id === id) ?? STYLES[0];
}
