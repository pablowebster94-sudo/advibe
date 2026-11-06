"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { paintCircle, removeIslands } from "@/lib/photo/cutout";
import { Button, Notice, Panel, ProgressBar } from "./ui";

/**
 * Quita el fondo de una imagen en el navegador.
 *
 * La segmentación la hace @imgly/background-removal (modelo ONNX ejecutado con
 * onnxruntime-web). La imagen nunca sale del dispositivo: solo se descarga el
 * modelo la primera vez (luego lo sirve la caché del navegador).
 *
 * Sobre la máscara del modelo se aplica una limpieza automática de restos
 * sueltos, y un pincel permite borrar o restaurar zonas a mano.
 */

type Quality = "small" | "medium";
type Background = "transparent" | "white" | "black" | "custom";
type Tool = "none" | "erase" | "restore";

type Status =
  | { kind: "idle" }
  | { kind: "loading-model"; loaded: number; total: number }
  | { kind: "processing" }
  | { kind: "done" }
  | { kind: "error"; message: string };

interface Cutout {
  width: number;
  height: number;
  /** Píxeles del original (RGB) con el alfa de trabajo; es lo que se pinta. */
  image: ImageData;
  /** Máscara tal como la devolvió el modelo. */
  rawAlpha: Uint8ClampedArray;
  /** Máscara de trabajo (limpieza + retoques). */
  alpha: Uint8ClampedArray;
}

const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];
const MAX_UNDO = 20;

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

/** Dibuja una imagen en un lienzo del tamaño dado y devuelve sus píxeles. */
async function pixels(source: Blob, width?: number, height?: number): Promise<ImageData> {
  const bitmap = await createImageBitmap(source);
  const w = width ?? bitmap.width;
  const h = height ?? bitmap.height;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No se pudo crear el lienzo.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return ctx.getImageData(0, 0, w, h);
}

/**
 * Une el color del original con el alfa del modelo. El color sale del archivo
 * original (no del PNG del modelo) para que el pincel "Restaurar" recupere los
 * píxeles reales incluso donde el modelo los dejó totalmente transparentes.
 */
async function buildCutout(original: File, modelOutput: Blob): Promise<Cutout> {
  const image = await pixels(original);
  const mask = await pixels(modelOutput, image.width, image.height);
  const size = image.width * image.height;
  const rawAlpha = new Uint8ClampedArray(size);
  for (let i = 0; i < size; i++) rawAlpha[i] = mask.data[4 * i + 3];
  return { width: image.width, height: image.height, image, rawAlpha, alpha: rawAlpha.slice() };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo exportar."))), "image/png"),
  );
}

export function BackgroundRemover() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cutoutRef = useRef<Cutout | null>(null);
  const undoRef = useRef<Uint8ClampedArray[]>([]);
  const strokeRef = useRef<{ x: number; y: number } | null>(null);
  const runId = useRef(0);

  const [file, setFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [quality, setQuality] = useState<Quality>("medium");
  const [background, setBackground] = useState<Background>("transparent");
  const [customColor, setCustomColor] = useState("#78d94f");
  const [compare, setCompare] = useState(0);
  const [cleanup, setCleanup] = useState(true);
  const [tool, setTool] = useState<Tool>("none");
  const [brush, setBrush] = useState(40);
  const [undoCount, setUndoCount] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => () => { if (sourceUrl) URL.revokeObjectURL(sourceUrl); }, [sourceUrl]);

  /** Copia la máscara al ImageData y lo pinta (entero o solo un rectángulo). */
  const draw = useCallback((rect?: { x: number; y: number; w: number; h: number }) => {
    const cut = cutoutRef.current;
    const canvas = canvasRef.current;
    if (!cut || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (canvas.width !== cut.width || canvas.height !== cut.height) {
      canvas.width = cut.width;
      canvas.height = cut.height;
    }
    const r = rect ?? { x: 0, y: 0, w: cut.width, h: cut.height };
    const data = cut.image.data;
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        const i = y * cut.width + x;
        data[4 * i + 3] = cut.alpha[i];
      }
    }
    ctx.putImageData(cut.image, 0, 0, r.x, r.y, r.w, r.h);
  }, []);

  // Pinta el resultado en cuanto el lienzo existe.
  useEffect(() => { if (ready) draw(); }, [ready, draw]);

  const pushUndo = useCallback(() => {
    const cut = cutoutRef.current;
    if (!cut) return;
    undoRef.current.push(cut.alpha.slice());
    if (undoRef.current.length > MAX_UNDO) undoRef.current.shift();
    setUndoCount(undoRef.current.length);
  }, []);

  const undo = useCallback(() => {
    const cut = cutoutRef.current;
    const previous = undoRef.current.pop();
    if (!cut || !previous) return;
    cut.alpha = previous;
    setUndoCount(undoRef.current.length);
    draw();
  }, [draw]);

  /** Recalcula la máscara desde la del modelo (descarta retoques a mano). */
  const applyCleanup = useCallback((enabled: boolean) => {
    const cut = cutoutRef.current;
    if (!cut) return;
    const alpha = cut.rawAlpha.slice();
    if (enabled) removeIslands(alpha, cut.width, cut.height);
    cut.alpha = alpha;
    draw();
  }, [draw]);

  const process = useCallback(async (input: File, model: Quality, clean: boolean) => {
    const id = ++runId.current;
    cutoutRef.current = null;
    undoRef.current = [];
    setUndoCount(0);
    setReady(false);
    setTool("none");
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
      const cut = await buildCutout(input, blob);
      if (id !== runId.current) return;
      if (clean) removeIslands(cut.alpha, cut.width, cut.height);
      cutoutRef.current = cut;
      setCompare(0);
      setReady(true);
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
      void process(next, quality, cleanup);
    },
    [process, quality, cleanup],
  );

  // ---- Pincel ----

  const toImage = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    return {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale,
      radius: (brush / 2) * scale,
    };
  };

  const moveRing = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const ring = ringRef.current;
    if (!ring) return;
    const rect = e.currentTarget.getBoundingClientRect();
    ring.style.display = tool === "none" ? "none" : "block";
    ring.style.width = ring.style.height = `${brush}px`;
    ring.style.transform = `translate(${e.clientX - rect.left - brush / 2}px, ${e.clientY - rect.top - brush / 2}px)`;
  };

  const stroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const cut = cutoutRef.current;
    if (!cut || tool === "none") return;
    const { x, y, radius } = toImage(e);
    const value = tool === "erase" ? 0 : 255;
    const from = strokeRef.current ?? { x, y };
    // Interpola entre eventos para que un trazo rápido no deje huecos.
    const steps = Math.max(1, Math.ceil(Math.hypot(x - from.x, y - from.y) / Math.max(1, radius / 3)));
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (let s = 1; s <= steps; s++) {
      const px = from.x + ((x - from.x) * s) / steps;
      const py = from.y + ((y - from.y) * s) / steps;
      const r = paintCircle(cut.alpha, cut.width, cut.height, px, py, radius, value);
      if (!r) continue;
      x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y);
      x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h);
    }
    strokeRef.current = { x, y };
    if (x1 > x0) draw({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (tool === "none") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pushUndo();
    strokeRef.current = null;
    stroke(e);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    moveRing(e);
    if (strokeRef.current) stroke(e);
  };

  const endStroke = () => { strokeRef.current = null; };

  // ---- Exportar ----

  const download = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !file || !ready) return;
    let out = canvas;
    if (background !== "transparent") {
      out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const ctx = out.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = backgroundCss(background, customColor);
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(canvas, 0, 0);
    }
    const blob = await canvasToBlob(out);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseName(file.name)}-sin-fondo.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [file, ready, background, customColor]);

  const reset = () => {
    runId.current++;
    cutoutRef.current = null;
    undoRef.current = [];
    setUndoCount(0);
    setFile(null);
    setSourceUrl(null);
    setReady(false);
    setTool("none");
    setStatus({ kind: "idle" });
    if (inputRef.current) inputRef.current.value = "";
  };

  const busy = status.kind === "loading-model" || status.kind === "processing";
  const editing = tool !== "none";

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
                  style={{ background: ready ? backgroundCss(background, customColor) : undefined }}
                >
                  {ready ? (
                    <canvas
                      ref={canvasRef}
                      data-testid="preview"
                      aria-label="Imagen sin fondo"
                      className={`block max-h-[70vh] w-auto max-w-full ${editing ? "cursor-none touch-none" : ""}`}
                      onPointerDown={onPointerDown}
                      onPointerMove={onPointerMove}
                      onPointerUp={endStroke}
                      onPointerCancel={endStroke}
                      onPointerLeave={() => { if (ringRef.current) ringRef.current.style.display = "none"; }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={sourceUrl}
                      alt="Imagen original"
                      className={`block max-h-[70vh] w-auto max-w-full ${busy ? "opacity-40" : ""}`}
                    />
                  )}
                  {ready && compare > 0 && !editing && (
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
                  <div
                    ref={ringRef}
                    aria-hidden
                    className={`pointer-events-none absolute left-0 top-0 hidden rounded-full border-2 ${
                      tool === "erase" ? "border-red-400" : "border-[#78d94f]"
                    } shadow-[0_0_0_1px_rgba(0,0,0,0.6)]`}
                  />
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
              {ready && !editing && (
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
              {editing && (
                <p className="mt-3 text-xs text-neutral-400">
                  {tool === "erase"
                    ? "Pasa el pincel por los restos de fondo que quieras borrar."
                    : "Pasa el pincel por las partes del sujeto que se borraron por error."}
                </p>
              )}
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            <Panel title="Retocar">
              <div className="flex flex-col gap-3 p-3">
                <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-neutral-200">
                  <input
                    type="checkbox"
                    checked={cleanup}
                    disabled={!ready}
                    onChange={(e) => {
                      setCleanup(e.target.checked);
                      pushUndo();
                      applyCleanup(e.target.checked);
                    }}
                    className="h-4 w-4 accent-[#78d94f]"
                  />
                  Limpiar restos sueltos
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["erase", "Borrar"],
                      ["restore", "Restaurar"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      disabled={!ready}
                      onClick={() => setTool(tool === value ? "none" : value)}
                      className={`min-h-11 rounded-lg border px-3 text-sm transition-colors disabled:cursor-not-allowed disabled:text-neutral-600 ${
                        tool === value
                          ? "border-[#78d94f] bg-[#78d94f]/10 text-neutral-100"
                          : "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {editing && (
                  <label className="flex items-center gap-3 text-xs text-neutral-400">
                    <span className="shrink-0">Pincel</span>
                    <input
                      type="range"
                      min={6}
                      max={160}
                      value={brush}
                      onChange={(e) => setBrush(Number(e.target.value))}
                      className="w-full accent-[#78d94f]"
                      aria-label="Tamaño del pincel"
                    />
                  </label>
                )}
                <Button variant="ghost" onClick={undo} disabled={undoCount === 0}>
                  Deshacer
                </Button>
              </div>
            </Panel>

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
                    if (file) void process(file, q, cleanup);
                  }}
                  className="min-h-11 rounded-lg border border-neutral-700 bg-neutral-800 px-3 text-sm text-neutral-100"
                >
                  <option value="medium">Alta (recomendada)</option>
                  <option value="small">Rápida</option>
                </select>
                <p className="text-[11px] text-neutral-500">Cambiarla vuelve a procesar la imagen.</p>
              </div>
            </Panel>

            <Button variant="primary" onClick={download} disabled={!ready}>
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
