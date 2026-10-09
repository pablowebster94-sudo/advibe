import { ICON_SHAPES, type IconName } from "@/lib/templates/icon-shapes";

/**
 * Picks an icon for a line of ad copy ("Sofá triple", "Tapizado antifluido",
 * "Envío a todo el país") from Spanish keywords. Deterministic: the first
 * rule whose keyword appears in the text wins; unknown text gets a neutral
 * check mark, never a misleading pictogram.
 */
const RULES: Array<[RegExp, IconName]> = [
  [/\b(poltrona|sillon|butaca)/, "armchair"],
  [/\b(sofa|sala|mueble|seccional)/, "sofa"],
  [/\b(mesa|comedor|escritorio)/, "table-2"],
  [/\b(cama|colchon|dormitorio|cuarto)/, "bed-double"],
  [/\b(lampara|iluminacion)/, "lamp-floor"],
  [/\b(madera|roble|pino|estructura)/, "tree-deciduous"],
  [/\b(antifluido|impermeable|lavable|limpiar|agua)/, "droplets"],
  [/\b(garantia|durab|resistente|seguro|confiable|calidad)/, "shield-check"],
  [/\b(envio|entrega|delivery|domicilio|despacho)/, "truck"],
  [/\b(tarjeta|credito|diferido|cuotas)/, "credit-card"],
  [/\b(meses|plazo|financ)/, "calendar-days"],
  [/(%|\bdescuento|\brebaja|\bpromo)/, "percent"],
  [/\b(oferta|precio|ahorro)/, "tag"],
  [/\b(regalo|obsequio|gratis)/, "gift"],
  [/\b(horario|24\/7|rapido|hoy)/, "clock"],
  [/\b(ubicacion|local|tienda|sucursal)/, "map-pin"],
  [/\b(instalacion|armado|servicio tecnico|mantenimiento)/, "wrench"],
  [/\b(diseno|moderno|elegante|estilo|nuevo)/, "sparkles"],
  [/\b(confort|comod|suave)/, "heart-handshake"],
  [/\b(km|kilometr)/, "gauge"],
  [/\b(motor|combustible|gasolina|diesel|consumo)/, "fuel"],
  [/\b(caja|automatica|manual|transmision)/, "cog"],
  [/\b(auto|carro|vehiculo|camioneta)/, "car"],
  [/\b(dueno|familia|personas|pasajeros)/, "users"],
  [/\b(comida|menu|plato|almuerzo|desayuno)/, "utensils"],
  [/\b(cafe|bebida)/, "coffee"],
  [/\b(ropa|talla|prenda)/, "shirt"],
  [/\b(premium|lujo|exclusiv)/, "gem"],
  [/\b(medida|tamano|dimension|metros|cm)/, "ruler"],
  [/\b(casa|hogar|departamento|inmueble)/, "house"],
  [/\b(whatsapp|mensaje|escribenos)/, "message-circle"],
  [/\b(llama|telefono|celular)/, "phone"],
];

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function iconFor(text: string): IconName {
  const normalized = normalize(text);
  return RULES.find(([pattern]) => pattern.test(normalized))?.[1] ?? "check-circle-2";
}

/** The icon as an SVG group at (x, y), `size` px wide, stroked in `color`. */
export function iconSvg(name: IconName, x: number, y: number, size: number, color: string, strokeWidth = 1.8) {
  const scale = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${ICON_SHAPES[name]}</g>`;
}
