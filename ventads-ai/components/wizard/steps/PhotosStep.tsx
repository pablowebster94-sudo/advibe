"use client";

import { ImageUploader, type UploadedImage } from "@/components/wizard/ImageUploader";

export function PhotosStep({
  productImages,
  referenceImages,
  onProductImagesChange,
  onReferenceImagesChange,
}: {
  productImages: UploadedImage[];
  referenceImages: UploadedImage[];
  onProductImagesChange: (images: UploadedImage[]) => void;
  onReferenceImagesChange: (images: UploadedImage[]) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Fotografías del producto</h2>
        <p className="text-sm text-muted mt-1">
          Usamos tus fotos reales como base. No alteramos el producto: solo cambiamos
          fondo, composición y elementos gráficos alrededor de él.
        </p>
      </div>

      <ImageUploader
        label="Fotos del producto"
        hint="JPG, PNG o WEBP, hasta 10MB cada una. La primera se usa como imagen principal."
        folder="products"
        images={productImages}
        onChange={onProductImagesChange}
      />

      <ImageUploader
        label="Referencias visuales (opcional)"
        hint="Imágenes de inspiración para el estilo — no se usan como producto."
        folder="references"
        images={referenceImages}
        onChange={onReferenceImagesChange}
      />
    </div>
  );
}
