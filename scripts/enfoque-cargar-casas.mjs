// Publica en Enfoque Visual las casas que hoy se anuncian en Meta (textos de los anuncios, 27-09 a 09-10-2026).
// Uso: node enfoque-cargar-casas.mjs .env.prod   (archivo de `vercel env pull`)
// Si el slug ya existe, actualiza la publicación en lugar de duplicarla. Las fotos se suben luego desde el panel.
import { readFileSync } from "node:fs";

const env = Object.fromEntries(readFileSync(process.argv[2] || ".env.prod", "utf8").split("\n")
  .map(l => l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/)).filter(Boolean).map(m => [m[1], m[2]]));
const URL_ = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !KEY) { console.error("✗ Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo (¿variable marcada como Sensitive en Vercel?)."); process.exit(1); }
const H = { apikey: KEY, ...(KEY.startsWith("eyJ") ? { Authorization: "Bearer " + KEY } : {}), "Content-Type": "application/json" };
async function db(path, init = {}) {
  const r = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const t = await r.text(); if (!r.ok) throw new Error(`${r.status} ${t}`); return t ? JSON.parse(t) : null;
}

const CASAS = [
  {
    slug: "casa-remodelada-gualaceo-divina-misericordia",
    title: "Casa remodelada de 2 plantas en Gualaceo",
    price: 190000, property_type: "casa", operation_type: "venta",
    city: "Gualaceo", province: "Azuay", sector: "Divina Misericordia",
    land_area_m2: 223.96, built_area_m2: 223.04, bedrooms: 3, bathrooms: 3, parking_spots: 2, is_featured: true,
    description: "Casa de 2 plantas recién remodelada, a media cuadra de la iglesia Divina Misericordia en Gualaceo. Planta baja: garaje para 2 a 3 vehículos, sala, cocina, comedor, 1 habitación y baño social; atrás, lavandería, zona de barbacoa, patio y un cuarto adicional (bodega, gimnasio o clóset). Planta alta: habitación máster con walk-in clóset y baño privado, hall amplio (sala de cine o de estar) y 1 habitación más con baño compartido. Losa de hormigón armado, lista para habitar. Venta directa con el propietario, sin intermediarios.",
    features: ["2 plantas", "Recién remodelada", "Garaje para 2–3 vehículos", "Habitación máster con walk-in clóset y baño privado", "Zona de barbacoa y patio", "Hall amplio / sala de estar", "Losa de hormigón armado", "Venta directa con el propietario"],
  },
  {
    slug: "casa-de-campo-tasqui-sigsig",
    title: "Casa de campo en Tasqui, a 5 minutos de Sígsig",
    price: 165000, property_type: "casa", operation_type: "venta",
    city: "Sígsig", province: "Azuay", sector: "Tasqui",
    land_area_m2: 3189, built_area_m2: 100, bedrooms: 4, bathrooms: 1, parking_spots: 1, is_featured: false,
    description: "Casa de campo rodeada de naturaleza, a solo 5 minutos de Sígsig. Terreno amplio de 3.189 m² con espacio para tu familia, tu huerto y tus animales. Ideal para vivir tranquilo, para fines de semana o como inversión. Precio negociable según la forma de pago.",
    features: ["3.189 m² de terreno", "Aprox. 100 m² de construcción", "4 dormitorios", "1 baño completo", "Garaje", "Entorno natural, a 5 min de Sígsig", "Precio negociable según forma de pago"],
  },
];

let owner = (await db("owners?name=eq.AdVibe%20Agencia&kind=eq.propio&select=id&limit=1"))[0]?.id;
if (!owner) owner = (await db("owners", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ name: "AdVibe Agencia", kind: "propio" }) }))[0].id;

for (const c of CASAS) {
  const row = { ...c, currency: "USD", owner_id: owner, publication_status: "publicado", availability: "disponible" };
  const [saved] = await db("properties?on_conflict=slug", { method: "POST", headers: { Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify(row) });
  console.log(`✓ ${saved.title} — ${saved.publication_status} — /propiedades/${saved.slug}`);
}
console.log("\nListo. Revisa https://enfoque.advibeagencia.com/propiedades y sube las fotos desde /admin/propiedades.");
