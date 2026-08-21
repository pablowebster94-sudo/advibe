/**
 * Suggested categories shown in the product form. `category` on Product is
 * a free-form string, not a DB enum — any value works, this list only
 * powers the autocomplete so the system stays open to new verticals
 * without a migration (AGENTS.md #1/#3).
 */
export const CATEGORIES = [
  { id: "vehiculos", label: "Vehículos" },
  { id: "muebles", label: "Muebles" },
  { id: "electronica", label: "Electrónica" },
  { id: "inmuebles", label: "Inmuebles" },
  { id: "restaurantes", label: "Restaurantes" },
  { id: "retail", label: "Productos de retail" },
  { id: "servicios", label: "Servicios" },
  { id: "cursos", label: "Cursos" },
  { id: "educacion", label: "Instituciones educativas" },
  { id: "promociones", label: "Promociones" },
  { id: "otro", label: "Otro" },
] as const;
