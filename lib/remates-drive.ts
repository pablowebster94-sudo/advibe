// Catálogo alimentado por una CARPETA de Google Drive: el cliente sube la foto y el mueble
// aparece solo. El nombre, los precios y la categoría se leen del nombre del archivo.
//
// Convención:   Sofá Bruno - 720 - 450 - Salas.jpg
//               nombre     - antes - remate - categoría (opcional)
// Variantes admitidas:
//   "Sofá Bruno - 450.jpg"              un solo precio = precio de remate
//   "Sofá Bruno.jpg"                    sin precio, solo foto
//   "Sofá Bruno - 720 - 450 VENDIDO.jpg" la palabra VENDIDO lo marca como vendido
//   "01. Sofá Bruno - 450.jpg"          la numeración inicial sirve para ordenar y no se muestra
// Varias fotos del mismo mueble: mismo nombre, y se agrupan en una sola ficha.

import { precio, type Remate } from "@/lib/remates";

export type ArchivoDrive = {
  id: string;
  nombre: string;      // nombre del archivo, con extensión
  carpeta?: string;    // subcarpeta: sirve de categoría si el nombre no la trae
};

const EXTENSIONES = /\.(jpe?g|png|webp|gif|avif|heic)$/i;
const VENDIDO = /\b(vendido|vendida|agotado|agotada|reservado|reservada)\b/i;

export function esImagen(nombre: string): boolean {
  return EXTENSIONES.test(nombre);
}

// ¿Este trozo es un precio? Solo dígitos y separadores, con $ opcional.
function esPrecio(parte: string): boolean {
  return /^\$?\s*[\d.,]+$/.test(parte.trim()) && precio(parte) !== undefined;
}

export type Partes = {
  nombre: string;
  precioAntes?: number;
  precioRemate?: number;
  categoria?: string;
  vendido: boolean;
};

export function leerNombreArchivo(archivo: string): Partes {
  let base = archivo.replace(EXTENSIONES, "");
  const vendido = VENDIDO.test(base);
  base = base.replace(VENDIDO, " ");
  // Numeración para ordenar ("01. ", "3 - "): se usa para el orden, no para mostrar.
  base = base.replace(/^\s*\d{1,3}\s*[.)]\s*/, "");
  // Sufijo de foto repetida que añade Drive o el teléfono: "(1)", "-2" al final.
  base = base.replace(/\s*\(\d+\)\s*$/, "");

  const partes = base.split(/\s+-\s+|\s+—\s+/).map((p) => p.trim()).filter(Boolean);
  const nombre = (partes.shift() ?? "").replace(/\s+/g, " ").trim();
  const precios: number[] = [];
  const resto: string[] = [];
  for (const p of partes) {
    if (esPrecio(p)) { const n = precio(p); if (n !== undefined) precios.push(n); }
    else resto.push(p);
  }
  // Con dos precios, el mayor es el de antes: da igual en qué orden los escriba.
  let precioAntes: number | undefined;
  let precioRemate: number | undefined;
  if (precios.length >= 2) { precioAntes = Math.max(precios[0], precios[1]); precioRemate = Math.min(precios[0], precios[1]); }
  else if (precios.length === 1) { precioRemate = precios[0]; }

  return { nombre, precioAntes, precioRemate, categoria: resto[0], vendido };
}

export function fotoDeDrive(id: string): string {
  return "https://lh3.googleusercontent.com/d/" + id;
}

function clave(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Agrupa por nombre: tres fotos del mismo sofá son un solo mueble con tres fotos.
export function archivosARemates(archivos: ArchivoDrive[]): Remate[] {
  const porNombre = new Map<string, Remate>();
  for (const a of archivos) {
    if (!esImagen(a.nombre)) continue;
    const p = leerNombreArchivo(a.nombre);
    if (!p.nombre) continue;
    const k = clave(p.nombre);
    const existente = porNombre.get(k);
    if (existente) {
      existente.fotos.push(fotoDeDrive(a.id));
      // Los datos los pone la primera foto; las siguientes solo rellenan lo que falte.
      existente.precioAntes ??= p.precioAntes;
      existente.precioRemate ??= p.precioRemate;
      existente.categoria ??= p.categoria ?? a.carpeta;
      existente.vendido = existente.vendido || p.vendido;
      continue;
    }
    porNombre.set(k, {
      id: a.id,
      nombre: p.nombre,
      precioAntes: p.precioAntes,
      precioRemate: p.precioRemate,
      fotos: [fotoDeDrive(a.id)],
      categoria: p.categoria ?? a.carpeta,
      vendido: p.vendido,
    });
  }
  return [...porNombre.values()];
}
