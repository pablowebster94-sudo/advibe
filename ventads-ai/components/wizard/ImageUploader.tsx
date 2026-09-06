"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export type UploadedImage = {
  key: string;
  url: string;
  width: number;
  height: number;
};

async function uploadFile(file: File, folder: string): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/uploads", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Error al subir la imagen.");
  return data;
}

export function ImageUploader({
  images,
  onChange,
  folder,
  multiple = true,
  label,
  hint,
  aspectClassName = "aspect-square",
}: {
  images: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  folder: string;
  multiple?: boolean;
  label: string;
  hint?: string;
  aspectClassName?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      const files = Array.from(fileList);
      const uploaded = await Promise.all(files.map((file) => uploadFile(file, folder)));
      onChange(multiple ? [...images, ...uploaded] : uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir la imagen.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex flex-wrap gap-3">
        {images.map((image, index) => (
          <div
            key={image.key}
            className={`relative w-28 ${aspectClassName} overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface-muted`}
          >
            <Image
              src={image.url}
              alt=""
              fill
              sizes="112px"
              className="object-contain"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white cursor-pointer hover:bg-black/80"
              aria-label="Quitar imagen"
            >
              ×
            </button>
          </div>
        ))}
        {(multiple || images.length === 0) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`flex w-28 ${aspectClassName} flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-dashed border-border text-xs text-muted hover:border-accent-strong hover:text-accent-strong cursor-pointer disabled:opacity-60`}
          >
            <span className="text-xl leading-none">{uploading ? "…" : "+"}</span>
            <span>{uploading ? "Subiendo" : "Subir"}</span>
          </button>
        )}
      </div>
      {hint && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-danger">{error}</span>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
