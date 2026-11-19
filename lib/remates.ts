// Catálogo de remates y liquidaciones leído en vivo desde una hoja de Google publicada como CSV.
// El cliente actualiza la hoja y la página se actualiza sola: no hay base de datos ni panel.
// Documentado en docs/remates.md.

export type Remate = {
  id: string;
  nombre: string;
  precioAntes?: number;
  precioRemate?: number;
  fotos: string[];
  categoria?: string;
  medidas?: string;
  descripcion?: string;
  etiqueta?: string;
  ubicacion?: string;
  vendido: boolean;
};

/* ---------- CSV ---------- */

// Parser CSV con comillas (RFC 4180): los campos entre comillas pueden llevar comas,
// saltos de línea y comillas escapadas como "".
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // BOM de Google
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') { quoted = true; continue; }
    if (c === ",") { row.push(field); field = ""; continue; }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  row.push(field);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

// Encabezados: sin acentos, sin espacios, en minúsculas, para aceptar "Precio Remate" o "precio_remate".
function clave(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[\s-]+/g, "_");
}

// Sinónimos aceptados por columna, para no pelear con cómo la escribió el cliente.
const ALIAS: Record<string, string[]> = {
  nombre: ["nombre", "producto", "mueble", "titulo", "articulo"],
  precioAntes: ["precio_antes", "antes", "precio_normal", "precio_regular", "precio_lista"],
  precioRemate: ["precio_remate", "precio_ahora", "ahora", "remate", "precio_oferta", "precio"],
  fotos: ["foto", "fotos", "imagen", "imagenes", "url_foto"],
  categoria: ["categoria", "cat", "tipo", "linea"],
  medidas: ["medidas", "dimensiones", "medida"],
  descripcion: ["descripcion", "desc", "detalle", "detalles"],
  etiqueta: ["etiqueta", "tag", "badge", "sello"],
  ubicacion: ["ubicacion", "local", "sucursal", "tienda", "ciudad"],
  vendido: ["vendido", "agotado", "reservado"],
  mostrar: ["mostrar", "publicar", "activo", "visible"],
};

function indices(encabezados: string[]): Record<string, number> {
  const normalizados = encabezados.map(clave);
  const map: Record<string, number> = {};
  for (const [campo, nombres] of Object.entries(ALIAS)) {
    const i = normalizados.findIndex((h) => nombres.includes(h));
    if (i >= 0) map[campo] = i;
  }
  return map;
}

/* ---------- valores ---------- */

// Precios: acepta "$890", "890,50", "1.200" y "1,200.50". El último separador manda como decimal
// solo si deja 1 o 2 dígitos detrás; si no, es separador de miles.
export function precio(raw: string): number | undefined {
  const s = String(raw ?? "").replace(/[^\d.,]/g, "");
  if (!s) return undefined;
  const ultimo = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  let entero = s, decimales = "";
  if (ultimo >= 0 && s.length - ultimo - 1 > 0 && s.length - ultimo - 1 <= 2) {
    entero = s.slice(0, ultimo);
    decimales = s.slice(ultimo + 1);
  }
  const n = Number(entero.replace(/[.,]/g, "") + (decimales ? "." + decimales : ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const SI = ["si", "sí", "s", "x", "true", "1", "verdadero", "vendido", "agotado"];
const NO = ["no", "n", "false", "0", "falso"];
export function esSi(raw: string): boolean {
  return SI.includes(String(raw ?? "").trim().toLowerCase());
}
function esNo(raw: string): boolean {
  return NO.includes(String(raw ?? "").trim().toLowerCase());
}

// Fotos: acepta URL directa, enlace de Drive o el puro ID del archivo, separados por | o salto de línea.
// Un archivo de Drive se sirve como imagen por lh3.googleusercontent.com/d/<id>.
export function fotoURL(raw: string): string | undefined {
  const s = String(raw ?? "").trim();
  if (!s) return undefined;
  const drive = s.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:[^#]*&)?id=)([\w-]{20,})/)
    || s.match(/docs\.google\.com\/uc\?(?:[^#]*&)?id=([\w-]{20,})/);
  if (drive) return "https://lh3.googleusercontent.com/d/" + drive[1];
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[\w-]{20,}$/.test(s)) return "https://lh3.googleusercontent.com/d/" + s;
  return undefined;
}

function fotos(raw: string): string[] {
  return String(raw ?? "")
    .split(/[|\n;]+/)
    .map(fotoURL)
    .filter((x): x is string => Boolean(x));
}

function texto(raw: string | undefined): string | undefined {
  const s = String(raw ?? "").trim();
  return s || undefined;
}

/* ---------- filas -> productos ---------- */

export function filasARemates(rows: string[][]): Remate[] {
  if (rows.length < 2) return [];
  const col = indices(rows[0]);
  if (col.nombre === undefined) return [];
  const items: Remate[] = [];
  const en = (fila: string[], campo: string) => (col[campo] === undefined ? "" : fila[col[campo]] ?? "");
  rows.slice(1).forEach((fila, i) => {
    const nombre = texto(en(fila, "nombre"));
    if (!nombre) return;
    if (col.mostrar !== undefined && esNo(en(fila, "mostrar"))) return; // fila apagada a propósito
    items.push({
      id: "r" + (i + 1),
      nombre,
      precioAntes: precio(en(fila, "precioAntes")),
      precioRemate: precio(en(fila, "precioRemate")),
      fotos: fotos(en(fila, "fotos")),
      categoria: texto(en(fila, "categoria")),
      medidas: texto(en(fila, "medidas")),
      descripcion: texto(en(fila, "descripcion")),
      etiqueta: texto(en(fila, "etiqueta")),
      ubicacion: texto(en(fila, "ubicacion")),
      vendido: esSi(en(fila, "vendido")),
    });
  });
  return items;
}

/* ---------- utilidades de vista ---------- */

export function dinero(n?: number): string {
  if (n === undefined) return "";
  return "$" + n.toLocaleString("es-EC", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

export function descuento(x: Remate): number | undefined {
  if (!x.precioAntes || !x.precioRemate || x.precioAntes <= x.precioRemate) return undefined;
  return Math.round(((x.precioAntes - x.precioRemate) / x.precioAntes) * 100);
}

export function categorias(items: Remate[]): string[] {
  return [...new Set(items.map((x) => x.categoria).filter((x): x is string => Boolean(x)))]
    .sort((a, b) => a.localeCompare(b, "es"));
}

// Disponibles primero; dentro de cada grupo, el mayor descuento arriba.
export function ordenar(items: Remate[]): Remate[] {
  return [...items].sort((a, b) =>
    Number(a.vendido) - Number(b.vendido) || (descuento(b) ?? 0) - (descuento(a) ?? 0));
}

export function filtrar(items: Remate[], categoria?: string): Remate[] {
  if (!categoria || categoria === "todo") return items;
  return items.filter((x) => clave(x.categoria ?? "") === clave(categoria));
}

// Enlace de WhatsApp con el mueble y el precio ya escritos.
export function enlaceWhatsApp(numero: string, negocio: string, x: Remate): string {
  const precioTxt = x.precioRemate ? " (" + dinero(x.precioRemate) + ")" : "";
  const msg = `Hola ${negocio}, me interesa el ${x.nombre}${precioTxt} que vi en la página de remates.`;
  return "https://wa.me/" + numero.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg);
}
