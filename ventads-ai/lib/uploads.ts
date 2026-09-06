import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class UploadValidationError extends Error {}

/**
 * Validates an uploaded image and re-encodes it with sharp. Re-encoding
 * (rather than trusting the original bytes) both normalizes the format and
 * strips anything that isn't actual pixel data, so a file that merely
 * *claims* to be a JPEG can't smuggle something else through — never trust
 * client-supplied files (AGENTS.md #19).
 */
export async function processUploadedImage(file: File) {
  if (!(file.type in ALLOWED_MIME_TO_EXT)) {
    throw new UploadValidationError(
      "Formato no soportado. Usa JPG, PNG o WEBP."
    );
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError("La imagen supera el límite de 10MB.");
  }
  if (file.size === 0) {
    throw new UploadValidationError("El archivo está vacío.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const rawBuffer = Buffer.from(arrayBuffer);

  let image = sharp(rawBuffer, { failOn: "error" }).rotate(); // auto-orient from EXIF, then drop it
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new UploadValidationError("No se pudo leer la imagen.");
  }
  if (metadata.width > 8000 || metadata.height > 8000) {
    throw new UploadValidationError("La imagen es demasiado grande.");
  }

  const MAX_DIMENSION = 2400;
  if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
    image = image.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside" });
  }

  const outputExtension = ALLOWED_MIME_TO_EXT[file.type];
  const buffer =
    outputExtension === "png"
      ? await image.png().toBuffer()
      : outputExtension === "webp"
        ? await image.webp({ quality: 92 }).toBuffer()
        : await image.jpeg({ quality: 92 }).toBuffer();

  const finalMeta = await sharp(buffer).metadata();

  return {
    buffer,
    extension: outputExtension,
    contentType: file.type,
    width: finalMeta.width ?? metadata.width,
    height: finalMeta.height ?? metadata.height,
  };
}
