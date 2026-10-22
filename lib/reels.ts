export type Reel = {
  id: string;
  client: string;
  type: string;
  sector: "Automotriz" | "Gastronomía" | "Retail" | "Educación" | "Salud" | "Deporte" | "IA";
};

const all: Reel[] = [
  { id: "kamauto", client: "Kamauto", type: "Sketch comercial", sector: "Automotriz" },
  { id: "am-mini-cooper", client: "AM Motorsport", type: "Reel de vehículo", sector: "Automotriz" },
  { id: "restaurante", client: "Bocabell", type: "Video gastronómico", sector: "Gastronomía" },
  { id: "muebles", client: "Muebles Ideal", type: "Video de producto", sector: "Retail" },
  { id: "rocys", client: "Roxy's Joyería", type: "Video de catálogo", sector: "Retail" },
  { id: "aa-school", client: "AA School", type: "Campaña de inscripciones", sector: "Educación" },
  { id: "cetad", client: "CETAD San Lucas", type: "Video institucional", sector: "Salud" },
  { id: "am-motorsport", client: "AM Motorsport", type: "Reel de producto", sector: "Automotriz" },
  { id: "kamauto-entregas", client: "Kamauto", type: "Entregas a clientes", sector: "Automotriz" },
  { id: "colchones", client: "Tienda de descanso", type: "Video de producto", sector: "Retail" },
  { id: "basquet", client: "Club de básquet", type: "Cobertura deportiva", sector: "Deporte" },
  { id: "sketch-ia", client: "AdVibe", type: "Sketch con IA", sector: "IA" },
];

const byId = (ids: string[]) => ids.map((id) => all.find((reel) => reel.id === id)).filter((reel): reel is Reel => Boolean(reel));

/** Selección corta para la página principal: un video por rubro. */
export const homeReels = byId(["kamauto", "restaurante", "muebles", "rocys", "aa-school", "cetad"]);

/** Galería completa para /casos. */
export const allReels = all;

export { byId as reelsById };
