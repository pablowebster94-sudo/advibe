import { cache } from "react";
import { filasARemates, parseCSV, type Remate } from "@/lib/remates";

// Configuración por cliente. Añadir otra mueblería es una entrada más aquí y una ruta nueva.
export type ClienteRemates = {
  slug: string;
  negocio: string;
  csvEnv: string;   // variable con el CSV publicado de su hoja
  waEnv: string;    // variable con su WhatsApp (solo dígitos, con código de país)
  titulo: string;
  resaltado: string;
  subtitulo: string;
};

export const MUEBLES_IDEAL: ClienteRemates = {
  slug: "muebles-ideal",
  negocio: "Muebles Ideal",
  csvEnv: "REMATES_MUEBLES_IDEAL_CSV",
  waEnv: "NEXT_PUBLIC_REMATES_MUEBLES_IDEAL_WA",
  titulo: "Remates y",
  resaltado: "liquidaciones",
  subtitulo: "Muebles de exhibición y fin de temporada a precio de remate. Stock limitado: lo que se va, no se repone.",
};

export function demoPermitido(env: Record<string, string | undefined> = process.env): boolean {
  if (env.REMATES_ALLOW_DEMO === "true") return true;
  if (env.REMATES_ALLOW_DEMO === "false") return false;
  return env.NODE_ENV !== "production";
}

// Muebles de ejemplo: solo en desarrollo o con REMATES_ALLOW_DEMO=true. Nunca en producción.
const DEMO: Remate[] = filasARemates(parseCSV(
  `nombre,precio_antes,precio_remate,foto,categoria,medidas,descripcion,etiqueta,ubicacion,vendido
Juego de dormitorio Milano 2 plazas,890,590,https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=70,Dormitorios,Cama + 2 veladores + cómoda,Madera de eucalipto con acabado nogal.,Último disponible,Gualaceo,
Sofá modular Bruno 3 puestos,720,450,https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=70,Salas,2.10 x 0.85 x 0.80 m,Tapiz antimanchas color plomo.,Remate,Gualaceo,
Comedor Rústico 6 sillas,980,690,https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1200&q=70,Comedores,Mesa 1.60 x 0.90 m,Madera maciza con 6 sillas tapizadas.,,Montecristi,
Colchón Ortopédico 2 plazas,340,199,https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=70,Colchones,190 x 140 cm,Resortes bonnell y pillow top.,Oferta,Gualaceo,si`));

export function whatsapp(c: ClienteRemates, env: Record<string, string | undefined> = process.env): string {
  return (env[c.waEnv] ?? "").replace(/\D/g, "");
}

// Normaliza el enlace publicado de Google Sheets para que siempre devuelva CSV.
export function urlCSV(raw: string): string {
  let u = raw.trim();
  if (!u) return "";
  u = u.replace("/pubhtml", "/pub").replace(/([?&])output=[^&]*&?/, "$1").replace(/[?&]$/, "");
  return u + (u.includes("?") ? "&" : "?") + "output=csv";
}

async function leerHoja(c: ClienteRemates): Promise<Remate[]> {
  const configurado = process.env[c.csvEnv];
  if (!configurado) {
    if (demoPermitido()) return DEMO;
    console.error(`[remates] Falta ${c.csvEnv}; el catálogo de ${c.negocio} sale vacío en producción.`);
    return [];
  }
  try {
    // revalidate 60: la hoja se consulta como máximo una vez por minuto, así un cambio de
    // precio o un "vendido" se ve casi al instante sin golpear a Google en cada visita.
    const res = await fetch(urlCSV(configurado), { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const items = filasARemates(parseCSV(await res.text()));
    if (!items.length) console.error(`[remates] La hoja de ${c.negocio} respondió sin productos usables.`);
    return items;
  } catch (error) {
    console.error(`[remates] Error leyendo la hoja de ${c.negocio}:`, error);
    return demoPermitido() ? DEMO : [];
  }
}

// cache(): generateMetadata y la página comparten una sola lectura por petición.
export const cargarRemates = cache((c: ClienteRemates): Promise<Remate[]> => leerHoja(c));
