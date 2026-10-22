// Cliente mínimo de la API de Zernio (https://zernio.com/api). Solo servidor.
// La clave va en ZERNIO_API_KEY; nunca en el navegador ni en el repo.

const BASE_URL = process.env.ZERNIO_API_URL || "https://zernio.com/api";

export type ZernioAccount = { _id: string; platform: string; username?: string; displayName?: string; profileId?: string };

async function zernio<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = process.env.ZERNIO_API_KEY;
  if (!key) throw new Error("Falta ZERNIO_API_KEY en el servidor.");
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...init.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.error || `Zernio respondió ${res.status}`);
  return data as T;
}

export async function listarCuentas() {
  const data = await zernio<{ accounts?: ZernioAccount[] }>("/v1/accounts");
  return data.accounts ?? [];
}

// Sube un archivo con el flujo presign → PUT y devuelve la URL pública para mediaItems.
export async function subirMedia(archivo: Buffer, filename: string, contentType: string) {
  const { uploadUrl, publicUrl } = await zernio<{ uploadUrl: string; publicUrl: string }>("/v1/media/presign", {
    method: "POST",
    body: JSON.stringify({ filename, contentType, size: archivo.length }),
  });
  const put = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": contentType }, body: new Uint8Array(archivo) });
  if (!put.ok) throw new Error(`No se pudo subir el archivo a Zernio (${put.status}).`);
  return publicUrl;
}

// Siempre crea BORRADOR. Programar o publicar se hace aparte y solo con confirmación de Pablo
// (skill publicador-advibe, nivel 3 en docs/advibe-os/COO.md).
export async function crearBorrador(opts: { contenido: string; cuentas: ZernioAccount[]; mediaUrls: string[] }) {
  return zernio<{ post: { _id: string; status: string } }>("/v1/posts", {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({
      content: opts.contenido,
      mediaItems: opts.mediaUrls.map((url) => ({ type: "image", url })),
      platforms: opts.cuentas.map((c) => ({ platform: c.platform, accountId: c._id })),
      isDraft: true,
    }),
  });
}
