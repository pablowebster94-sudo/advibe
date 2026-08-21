import { NextResponse } from "next/server";
import { storage } from "@/lib/services/storage";
import { processUploadedImage, UploadValidationError } from "@/lib/uploads";

export const runtime = "nodejs";

/**
 * Generic image upload used by both the product photo step and the brand
 * logo step. Returns a storage key/url only — callers decide what row (if
 * any) to attach it to.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const folder = String(formData.get("folder") ?? "uploads");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (!/^[a-z0-9_-]+$/i.test(folder)) {
    return NextResponse.json({ error: "Carpeta inválida." }, { status: 400 });
  }

  try {
    const processed = await processUploadedImage(file);
    const { key, url } = await storage.save({
      buffer: processed.buffer,
      folder,
      extension: processed.extension,
    });

    return NextResponse.json({
      key,
      url,
      width: processed.width,
      height: processed.height,
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }
    console.error("Upload error", error);
    return NextResponse.json(
      { error: "No se pudo procesar la imagen." },
      { status: 500 }
    );
  }
}
