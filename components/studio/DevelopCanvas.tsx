"use client";

/**
 * The develop preview.
 *
 * Renders the stored proxy through the WebGL2 pipeline and blits the result to
 * a display canvas, with a before/after wipe, zoom and pan. When WebGL2 is not
 * available it shows the untouched preview and says so — it never presents an
 * unedited image as if the edit had been applied.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { Adjustments } from "@/lib/photo/types";
import {
  type DevelopRendererLike,
  backendOverrideFromLocation,
  createDevelopRenderer,
  targetSizeFor,
} from "@/lib/photo/render";
import * as db from "@/lib/photo/storage/db";

export interface DevelopCanvasProps {
  photoId: string;
  adjustments: Adjustments | null;
  /** 0 = fully "before", 1 = fully "after". */
  compare: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onRenderError?: (message: string | null) => void;
  /** Reports which backend is developing the preview, for the UI badge. */
  onBackend?: (backend: "webgl2" | "canvas2d" | null) => void;
}

interface Viewport {
  offsetX: number;
  offsetY: number;
}

export function DevelopCanvas({
  photoId,
  adjustments,
  compare,
  zoom,
  onZoomChange,
  onRenderError,
  onBackend,
}: DevelopCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<DevelopRendererLike | null>(null);
  const bitmapRef = useRef<ImageBitmap | null>(null);
  const viewportRef = useRef<Viewport>({ offsetX: 0, offsetY: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  /** Dedupes paint-time shader failures so they are reported exactly once. */
  const renderErrorRef = useRef<string | null>(null);

  // One piece of state instead of three: which photo is loaded, and what (if
  // anything) went wrong. Keeping it together means the effect writes it once,
  // after its awaits, rather than triggering a cascade of renders on mount.
  const [status, setStatus] = useState<{ loadedId: string | null; message: string | null }>({
    loadedId: null,
    message: null,
  });
  const rendererProbed = useRef(false);

  useEffect(() => {
    // Disposal only; the renderer itself is created lazily below, because
    // creating a GL context is worth deferring until there is something to show.
    return () => {
      rendererRef.current?.dispose();
      rendererRef.current = null;
      bitmapRef.current?.close();
      bitmapRef.current = null;
    };
  }, []);

  useEffect(() => {
    onRenderError?.(status.message);
  }, [status.message, onRenderError]);

  // --- source --------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const blob = await db.getProxy(photoId);
        if (cancelled) return;
        if (!blob) {
          setStatus({
            loadedId: null,
            message: "No hay previsualización almacenada para esta fotografía.",
          });
          return;
        }

        const full = await createImageBitmap(blob);
        if (cancelled) {
          full.close();
          return;
        }

        if (!rendererProbed.current) {
          rendererProbed.current = true;
          rendererRef.current = createDevelopRenderer({
            forceBackend: backendOverrideFromLocation(),
          });
          onBackend?.(rendererRef.current?.backend ?? null);
        }
        const renderer = rendererRef.current;

        // Develop at the size the backend can sustain: the GPU shades a full
        // proxy without noticing, the Canvas 2D loop cannot, and neither needs
        // more pixels than the screen will show.
        let bitmap = full;
        if (renderer) {
          const container = containerRef.current;
          const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
          const target = targetSizeFor(
            renderer.backend,
            full.width,
            full.height,
            Math.round((container?.clientWidth ?? 0) * dpr),
            Math.round((container?.clientHeight ?? 0) * dpr),
          );
          if (target.width !== full.width || target.height !== full.height) {
            bitmap = await createImageBitmap(full, {
              resizeWidth: target.width,
              resizeHeight: target.height,
              resizeQuality: "high",
            });
            full.close();
            if (cancelled) {
              bitmap.close();
              return;
            }
          }
        }

        bitmapRef.current?.close();
        bitmapRef.current = bitmap;
        renderer?.setSource(bitmap);
        viewportRef.current = { offsetX: 0, offsetY: 0 };
        setStatus({
          loadedId: photoId,
          message: renderer
            ? null
            : "Este navegador no permite ni WebGL2 ni Canvas 2D, así que se muestra la " +
              "previsualización sin editar. Los ajustes se guardan y se exportan igual en el XMP.",
        });
      } catch (error) {
        if (cancelled) return;
        setStatus({
          loadedId: null,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    })();

    return () => {
      cancelled = true;
    };
    // `onBackend` is a reporting callback; re-running on its identity would
    // reload the image on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoId]);

  const ready = status.loadedId === photoId;
  const message = status.message;

  // --- painting ------------------------------------------------------------
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const bitmap = bitmapRef.current;
    if (!canvas || !container || !bitmap) return;

    const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.imageSmoothingQuality = "high";

    // Fit-to-container, then apply zoom around the centre.
    const fit = Math.min(width / bitmap.width, height / bitmap.height);
    const scale = fit * zoom;
    const drawWidth = bitmap.width * scale;
    const drawHeight = bitmap.height * scale;
    const maxOffsetX = Math.max(0, (drawWidth - width) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - height) / 2);
    const offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, viewportRef.current.offsetX));
    const offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, viewportRef.current.offsetY));
    viewportRef.current = { offsetX, offsetY };

    const x = (width - drawWidth) / 2 + offsetX;
    const y = (height - drawHeight) / 2 + offsetY;

    const renderer = rendererRef.current;
    let after: CanvasImageSource = bitmap;
    if (renderer && adjustments) {
      try {
        renderer.render(adjustments);
        after = renderer.getCanvas() as unknown as CanvasImageSource;
      } catch (error) {
        // Paint runs inside an animation frame, so this must not loop: the ref
        // dedupes, and the state is written only the first time a given shader
        // failure appears.
        const text = error instanceof Error ? error.message : String(error);
        if (renderErrorRef.current !== text) {
          renderErrorRef.current = text;
          setStatus((current) => ({ ...current, message: text }));
        }
      }
    }

    context.drawImage(after, x, y, drawWidth, drawHeight);

    // The "before" half: the same proxy with no adjustments at all.
    if (compare < 1) {
      const splitAt = width * compare;
      context.save();
      context.beginPath();
      context.rect(splitAt, 0, width - splitAt, height);
      context.clip();
      context.drawImage(bitmap, x, y, drawWidth, drawHeight);
      context.restore();

      context.save();
      context.strokeStyle = "rgba(255,255,255,0.85)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(splitAt, 0);
      context.lineTo(splitAt, height);
      context.stroke();
      context.restore();
    }
  }, [adjustments, compare, zoom]);

  useEffect(() => {
    if (!ready) return;
    const frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, [ready, paint]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => paint());
    observer.observe(container);
    return () => observer.disconnect();
  }, [paint]);

  // --- interaction ---------------------------------------------------------
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      if (!event.ctrlKey && Math.abs(event.deltaY) < 2) return;
      event.preventDefault();
      const next = zoom * (event.deltaY > 0 ? 0.9 : 1.1);
      onZoomChange(Math.max(1, Math.min(8, next)));
    },
    [zoom, onZoomChange],
  );

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef<{ distance: number; zoom: number } | null>(null);

  const handlePointerDown = (event: React.PointerEvent) => {
    (event.target as Element).setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchStart.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    } else {
      dragRef.current = { x: event.clientX, y: event.clientY };
    }
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = distance / Math.max(1, pinchStart.current.distance);
      onZoomChange(Math.max(1, Math.min(8, pinchStart.current.zoom * ratio)));
      return;
    }

    if (dragRef.current && zoom > 1) {
      viewportRef.current = {
        offsetX: viewportRef.current.offsetX + (event.clientX - dragRef.current.x),
        offsetY: viewportRef.current.offsetY + (event.clientY - dragRef.current.y),
      };
      dragRef.current = { x: event.clientX, y: event.clientY };
      paint();
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
    if (pointers.current.size === 0) dragRef.current = null;
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={containerRef}
        className="advibe-canvas-bg h-full w-full overflow-hidden rounded-lg"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: zoom > 1 ? "none" : "pan-y", cursor: zoom > 1 ? "grab" : "default" }}
      >
        <canvas ref={canvasRef} className="block" />
      </div>
      {!ready && !message && (
        <div className="absolute inset-0 grid place-items-center text-sm text-neutral-500">
          Cargando previsualización…
        </div>
      )}
      {message && (
        <div className="absolute inset-x-3 bottom-3 rounded-lg border border-amber-900 bg-amber-950/80 px-3 py-2 text-xs text-amber-200 backdrop-blur">
          {message}
        </div>
      )}
    </div>
  );
}
