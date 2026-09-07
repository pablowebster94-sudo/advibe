"use client";

/**
 * Before/after preview with a draggable wipe, plus a waveform.
 *
 * The wipe rather than two side-by-side panes because the eye is very bad at
 * comparing two images a few centimetres apart and very good at spotting an
 * edge between them. The waveform because the two claims this tool makes about
 * itself — no clipped highlights, no crushed blacks — are claims about where
 * the trace sits at the top and bottom of the graticule, and a picture of a
 * face does not settle them.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { sampleCube, type Cube } from "@/lib/color/cube";

export interface PreviewSource {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

/** Runs every pixel through the LUT exactly as a player would. */
function applyCube(source: PreviewSource, cube: Cube): Uint8ClampedArray {
  const out = new Uint8ClampedArray(source.data.length);
  // Real frames repeat colours heavily once they are 8-bit; the chart is
  // nothing but flat patches. Memoising the trilinear lookup turns a
  // per-pixel cost into a per-distinct-colour one.
  const cache = new Map<number, number>();
  for (let at = 0; at < source.data.length; at += 4) {
    const key = (source.data[at] << 16) | (source.data[at + 1] << 8) | source.data[at + 2];
    let packed = cache.get(key);
    if (packed === undefined) {
      const [r, g, b] = sampleCube(
        cube,
        source.data[at] / 255,
        source.data[at + 1] / 255,
        source.data[at + 2] / 255,
      );
      packed = (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
      cache.set(key, packed);
    }
    out[at] = (packed >> 16) & 255;
    out[at + 1] = (packed >> 8) & 255;
    out[at + 2] = packed & 255;
    out[at + 3] = 255;
  }
  return out;
}

function Waveform({ source }: { source: PreviewSource }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const width = 256;
    const height = 128;
    canvas.width = width;
    canvas.height = height;

    // One column per horizontal position, one row per code value: the standard
    // waveform, accumulated as density so a flat area does not saturate it.
    const bins = new Float32Array(width * height);
    const columnStep = source.width / width;
    for (let x = 0; x < width; x += 1) {
      const sx = Math.min(source.width - 1, Math.floor(x * columnStep));
      for (let y = 0; y < source.height; y += 1) {
        const at = (y * source.width + sx) * 4;
        const luma =
          0.2126 * source.data[at] + 0.7152 * source.data[at + 1] + 0.0722 * source.data[at + 2];
        const row = height - 1 - Math.min(height - 1, Math.round((luma / 255) * (height - 1)));
        bins[row * width + x] += 1;
      }
    }

    let peak = 0;
    for (const value of bins) if (value > peak) peak = value;

    const image = context.createImageData(width, height);
    for (let index = 0; index < bins.length; index += 1) {
      // Cube root: a waveform is read for the faint traces, not the bright ones.
      const intensity = peak > 0 ? (bins[index] / peak) ** (1 / 3) : 0;
      const at = index * 4;
      image.data[at] = 120 * intensity;
      image.data[at + 1] = 217 * intensity;
      image.data[at + 2] = 79 * intensity;
      image.data[at + 3] = 255;
    }
    context.putImageData(image, 0, 0);

    // Graticule at 0 and 100 IRE, the two lines this tool promises to stay off.
    context.strokeStyle = "rgba(255,255,255,0.28)";
    context.lineWidth = 1;
    for (const level of [0, 1]) {
      const y = level === 0 ? height - 0.5 : 0.5;
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }, [source]);

  return (
    <canvas
      ref={canvasRef}
      className="h-24 w-full rounded-lg border border-neutral-800 bg-black"
      aria-label="Waveform de luminancia del resultado"
    />
  );
}

export function LutPreview({
  source,
  cube,
  sourceLabel,
}: {
  source: PreviewSource;
  cube: Cube;
  sourceLabel: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [split, setSplit] = useState(0.5);

  const graded = useMemo(() => applyCube(source, cube), [source, cube]);
  const gradedSource = useMemo<PreviewSource>(
    () => ({ width: source.width, height: source.height, data: graded }),
    [graded, source.width, source.height],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = source.width;
    canvas.height = source.height;
    const boundary = Math.round(split * source.width);

    const composed = new Uint8ClampedArray(source.data.length);
    for (let y = 0; y < source.height; y += 1) {
      for (let x = 0; x < source.width; x += 1) {
        const at = (y * source.width + x) * 4;
        const from = x < boundary ? source.data : graded;
        composed[at] = from[at];
        composed[at + 1] = from[at + 1];
        composed[at + 2] = from[at + 2];
        composed[at + 3] = 255;
      }
    }
    context.putImageData(new ImageData(composed, source.width, source.height), 0, 0);

    context.fillStyle = "#78d94f";
    context.fillRect(boundary - 1, 0, 2, source.height);
  }, [source, graded, split]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-neutral-800 bg-black">
        <canvas ref={canvasRef} className="block w-full" />
        <span className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-neutral-300">
          {sourceLabel}
        </span>
        <span className="pointer-events-none absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 text-[11px] text-[#a4ef84]">
          Con el LUT
        </span>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs text-neutral-500">Cortinilla de comparación</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(split * 100)}
          onChange={(event) => setSplit(Number(event.target.value) / 100)}
          className="advibe-slider w-full"
          style={{ ["--fill" as string]: `${split * 100}%` }}
          aria-label="Posición de la cortinilla entre el original y el resultado"
        />
      </label>
      <Waveform source={gradedSource} />
      <p className="text-[11px] leading-relaxed text-neutral-500">
        Waveform del resultado. Las líneas superior e inferior son 100 y 0 IRE: si la traza
        se apoya en ellas, hay recorte o negros aplastados.
      </p>
    </div>
  );
}
