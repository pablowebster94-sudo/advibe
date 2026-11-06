"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Notice, Panel, ProgressBar } from "./ui";

/**
 * Quita el fondo de una imagen en el navegador.
 *
 * La segmentación la hace @imgly/background-removal (modelo ONNX ejecutado con
 * onnxruntime-web). La imagen nunca sale del dispositivo: solo se descarga el
 * modelo la primera vez (luego lo sirve la caché del navegador).
 */

type Quality = "small" | "medium";
type Background = "transparent" | "white" | "black" | "custom";

type Status =
  | { kind: "idle" }
  | { kind: "loading-model"; loaded: number; total: number }
  | { kind: "processing" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

const CHECKER =
  "repeating-conic-gradient(#3a3a3f 0% 25%, #26262a 0% 50%) 50% / 20px 20px";

function backgroundCss(bg: Background, custom: string): string {
  if (bg === "white") return "#ffffff";
  if (bg === "black") return "#000000";
  if (bg === "custom") return custom;
  return CHECKER;
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "") || "imagen";
}

/** Compone el recorte sobre un color sólido y devuelve un JPEG/PNG. */
async function flatten(cutout: Blob, color: string): Promise<Blob> {
  const bitmap = await createImageBitmap(cutout);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No se pudo crear el lienzo.");
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo exportar."))), "image/png"),
  );
}

export function BackgroundRemover() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [quality, setQuality] = useState<Quality>("medium");
  const [background, setBackground] = useState<Background>("transparent");
  const [customColor, setCustomColor] = useState("#78d94f");
  const [compare, setCompare] = useState(0);
  const [dragging, setDragging] = useState(false);
  const runId = useRef(0);

  // Libera las URLs de objeto cuando cambian.
  useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); }, [sourceUrl]);
  useEffect(() => () => { if (resultUrl) URL.revokeObjectURL(resultUrl); }, [resultUrl]);

  const process = useCallback(async (input: File, model: Quality) => {
    const id = ++runId.current;
    setResult(null);
    setResultUrl(null);
    setStatus({ kind: "loading-model", loaded: 0, total: 0 });
    try {
      const { removeBackground } = await import("@imgly/background-removal");
      const blob = await removeBackground(input, {
        model,
        output: { format: "image/png" },
        progress: (key, current, total) => {
          if (id !== runId.current) return;
          if (key.startsWith("fetch:")) setStatus({ kind: "loading-model", loaded: current, total });
          else if (key.startsWith("compute:")) setStatus({ kind: "processing" });
        },
      });
      if (id !== runId.current) return;
      setResult(blob);
      setResultUrl(URL.createObjectURL(blob));
      setCompare(0);
      setStatus({ kind: "done" });
    } catch (err) {
      if (id !== runId.current) return;
      console.error(err);
      setStatus({
        kind: "error",
        message:
          "No se pudo quitar el fondo. Revisa tu conexión (el modelo se descarga la primera vez) e inténtalo de nuevo.",
      });
    }
  }, []);

  const pick = useCallback(
    (files: FileList | File[] | null) => {
      const next = files ? Array.from(files)[0] : undefined;
      if (!next) return;
      if (!ACCEPTED.includes(next.type)) {
        setStatus({ kind: "error", message: "Formato no compatible. Usa JPG, PNG o WebP." });
        return;
      }
      setFile(next);
      setSourceUrl(URL.createObjectURL(next));
      void process(next, quality);
    },
    [process, quality],
  );

  const download = useCallback(async () => {
    if (!result || !file) return;
    const blob = background === "transparent" ? result : await flatten(result, backgroundCss(background, customColor));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName(file.name)}-sin-fondo.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [result, file, background, customColor]);

  const reset = () => {
    runId.current++;
    setFile(null);
    setSourceUrl(null);
    setResult(null);
    setResultUrl(null);
    setStatus({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const busy = status.kind === "loading-model" || status.kind === "processing";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutral-100">Quitar fondo</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Sube una imagen y la IA elimina el fondo. Todo ocurre en tu navegador: la foto no se sube a ningún servidor.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        data-testid="file-input"
        onChange={(e) => pick(e.target.files)}
      />

      {!file && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files); }}
          className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
            dragging ? "border-[#78d94f] bg-[#78d94f]/5" : "border-neutral-700 bg-neutral-900/50"
          }`}
        >
          <p className="text-base font-medium text-neutral-200">Arrastra una imagen aquí</p>
          <p className="text-sm text-neutral-500">JPG, PNG o WebP</p>
          <Button variant="primary" onClick={() => inputRef.current?.click()}>
            Elegir imagen
          </Button>
        </div>
      )}

      {status.kind === "error" && <Notice tone="error">{status.message}</Notice>}

      {file && sourceUrl && (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <Panel title={file.name}>
            <div className="p-3">
              <div className="relative flex justify-center overflow-hidden rounded-lg bg-[#111113]">
                <div
                className="relative"
                style={{ background: resultUrl ? backgroundCss(background, customColor) : undefined }}
               >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl ?? sourceUrl}
                  alt={resultUrl ? "Imagen sin fondo" : "Imagen original"}
                  data-testid="preview"
                  className={`block max-h-[70vh] w-auto max-w-full ${busy ? "opacity-40" : ""}`}
                />
                {resultUrl && compare > 0 && (
                  // Original encima: ocupa la parte izquierda según el deslizador.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sourceUrl}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    style={{ clipPath: `inset(0 ${100 - compare}% 0 0)` }}
                  />
                )}
                </div>
                {busy && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8">
                    <p className="text-sm font-medium text-neutral-100">
                      {status.kind === "loading-model"
                        ? "Descargando modelo de IA (solo la primera vez)…"
                        : "Quitando el fondo…"}
                    </p>
                    {status.kind === "loading-model" && status.total > 0 && (
                      <div className="w-full max-w-xs">
                        <ProgressBar value={status.loaded} total={status.total} />
                      </div>
                    )}
                  </div>
                )}
              </div>
              {resultUrl && (
                <label className="mt-3 flex items-center gap-3 text-xs text-neutral-400">
                  <span className="shrink-0">Sin fondo</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={compare}
                    onChange={(e) => setCompare(Number(e.target.value))}
                    className="w-full accent-[#78d94f]"
                    aria-label="Comparar con el original"
                  />
                  <span className="shrink-0">Original</span>
                </label>
              )}
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel title="Fondo">
              <div className="grid grid-cols-2 gap-2 p-3">
                {(
                  [
                    ["transparent", "Transparente"],
                    ["white", "Blanco"],
                    ["black", "Negro"],
                    ["custom", "Color"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setBackground(value)}
                    className={`min-h-11 rounded-lg border px-3 text-sm transition-colors ${
                      background === value
                        ? "border-[#78d94f] bg-[#78d94f]/10 text-neutral-100"
                        : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {background === "custom" && (
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="col-span-2 h-11 w-full cursor-pointer rounded-lg border border-neutral-700 bg-transparent"
                    aria-label="Color de fondo"
                  />
                )}
              </div>
            </Panel>

            <Panel title="Precisión">
              <div className="flex flex-col gap-2 p-3">
                <select
                  value={quality}
                  disabled={busy}
                  onChange={(e) => {
                    const q = e.target.value as Quality;
                    setQuality(q);
                    if (file) void process(file, q);
                  }}
                  className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-neutral-100"
                >
                  <option value="medium">Alta (recomendada)</option>
                  <option value="small">Rápida</option>
                </select>
                <p className="text-[11px] text-neutral-500">Cambiarla vuelve a procesar la imagen.</p>
              </div>
            </Panel>

            <Button variant="primary" onClick={download} disabled={!result}>
              Descargar PNG
            </Button>
            <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={busy}>
              Otra imagen
            </Button>
            <Button variant="ghost" onClick={reset}>
              Empezar de nuevo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
