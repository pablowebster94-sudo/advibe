import { NextResponse } from "next/server";
import { crearBorrador, listarCuentas, subirMedia } from "@/lib/zernio";

export const runtime = "nodejs";
export const maxDuration = 60;

// Puente interno entre AdVibe Imágenes y Zernio. Misma clave de acceso que /imagenes.
// Solo lista cuentas y crea BORRADORES: nada se publica desde aquí.

function claveValida(request: Request) {
  const clave = process.env.IMAGENES_CLAVE;
  return Boolean(clave) && request.headers.get("x-clave") === clave;
}

export async function GET(request: Request) {
  if (!claveValida(request)) return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  try {
    const cuentas = await listarCuentas();
    return NextResponse.json({ cuentas: cuentas.map(({ _id, platform, username, displayName }) => ({ _id, platform, username, displayName })) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error con Zernio." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!claveValida(request)) return NextResponse.json({ error: "Clave incorrecta." }, { status: 401 });
  const body = await request.json().catch(() => null) as { imagen?: string; texto?: string; cuentaIds?: string[] } | null;
  const match = body?.imagen?.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!match) return NextResponse.json({ error: "Imagen inválida." }, { status: 400 });
  if (!body?.cuentaIds?.length) return NextResponse.json({ error: "Elige al menos una cuenta." }, { status: 400 });

  try {
    const todas = await listarCuentas();
    const cuentas = todas.filter((c) => body.cuentaIds!.includes(c._id));
    if (cuentas.length !== body.cuentaIds.length) return NextResponse.json({ error: "Alguna cuenta no existe en Zernio." }, { status: 400 });
    const [, tipo, b64] = match;
    const ext = tipo.split("/")[1].replace("jpeg", "jpg");
    const url = await subirMedia(Buffer.from(b64, "base64"), `advibe-${Date.now()}.${ext}`, tipo);
    const { post } = await crearBorrador({ contenido: (body.texto || "").slice(0, 2200), cuentas, mediaUrls: [url] });
    return NextResponse.json({ postId: post._id, estado: post.status });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error con Zernio." }, { status: 502 });
  }
}
