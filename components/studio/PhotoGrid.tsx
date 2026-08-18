"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { PhotoRecord, ProjectSettings } from "@/lib/photo/types";
import { SCENE_LABELS, WEDDING_CATEGORY_LABELS } from "@/lib/photo/editing/strategies";
import { summarizeAdjustments } from "@/lib/photo/editing/engine";
import { strategyLabelFor } from "@/lib/photo/pipeline";
import * as db from "@/lib/photo/storage/db";
import { Badge } from "./ui";

const STATUS_LABEL: Record<PhotoRecord["status"], string> = {
  pending: "Pendiente",
  analyzing: "Analizando",
  analyzed: "Analizada",
  edited: "Editada",
  error: "Error",
};

const STATUS_TONE: Record<PhotoRecord["status"], "neutral" | "good" | "warn" | "bad" | "accent"> = {
  pending: "neutral",
  analyzing: "warn",
  analyzed: "neutral",
  edited: "accent",
  error: "bad",
};

/**
 * Reveals a tile once it approaches the viewport, so a 900-photo project does
 * not hold 900 object URLs alive at once.
 *
 * Deliberately an effect over a ref object rather than an inline ref callback:
 * an inline callback is re-created on every render, so React tears the observer
 * down and rebuilds it on each state change, and a tile that is already on
 * screen can end up never receiving an intersection event.
 */
function useInViewport<T extends HTMLElement>(margin = "400px") {
  const ref = useRef<T | null>(null);
  // Browsers without IntersectionObserver start visible, decided at mount so no
  // extra render is needed to reach that state.
  const [inViewport, setInViewport] = useState(
    () => typeof window !== "undefined" && typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: margin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [margin]);

  return { ref, inViewport };
}

/** Thumbnails are loaded lazily from IndexedDB, one object URL per tile. */
function useThumbnail(photoId: string, enabled: boolean, version: unknown): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    (async () => {
      const blob = await db.getThumbnail(photoId);
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // `version` re-runs the lookup once analysis has stored the thumbnail: the
    // tile is created the moment the file is queued, before any blob exists.
  }, [photoId, enabled, version]);

  return url;
}

export const PhotoTile = memo(function PhotoTile({
  photo,
  settings,
  selected,
  active,
  onSelect,
  onOpen,
  onTogglePick,
}: {
  photo: PhotoRecord;
  settings: ProjectSettings;
  selected: boolean;
  active: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onOpen: (id: string) => void;
  onTogglePick: (id: string) => void;
}) {
  const { ref, inViewport } = useInViewport<HTMLDivElement>();
  const url = useThumbnail(photo.id, inViewport, photo.status);

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-lg border transition-colors ${
        active
          ? "border-[#78d94f]"
          : selected
            ? "border-neutral-400"
            : "border-neutral-800 hover:border-neutral-600"
      }`}
    >
      <button
        type="button"
        onClick={(event) => {
          if (event.shiftKey || event.metaKey || event.ctrlKey) onSelect(photo.id, true);
          else onOpen(photo.id);
        }}
        className="block w-full text-left"
        aria-label={`Abrir ${photo.fileName}`}
      >
        <div className="advibe-canvas-bg relative aspect-[3/2] w-full">
          {url ? (
            // Thumbnails are blobs from the device; next/image would add nothing
            // here and cannot optimise an object URL.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={photo.fileName}
              className="h-full w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-[11px] text-neutral-600">
              {photo.status === "error" ? "sin previsualización" : "…"}
            </div>
          )}
          {photo.picked && (
            <span className="absolute left-1.5 top-1.5 rounded bg-[#78d94f] px-1.5 py-0.5 text-[10px] font-bold text-[#06120a]">
              ★
            </span>
          )}
          {photo.rejected && (
            <span className="absolute left-1.5 top-1.5 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
              ✕
            </span>
          )}
        </div>
      </button>

      <div className="space-y-1 border-t border-neutral-800 bg-neutral-900/80 px-2 py-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate font-mono text-[11px] text-neutral-300" title={photo.fileName}>
            {photo.fileName}
          </span>
          <button
            type="button"
            onClick={() => onTogglePick(photo.id)}
            title="Marcar como seleccionada"
            className={`shrink-0 rounded px-1 text-sm leading-none ${
              photo.picked ? "text-[#78d94f]" : "text-neutral-600 hover:text-neutral-300"
            }`}
            aria-pressed={photo.picked}
          >
            ★
          </button>
        </div>

        {photo.status === "error" ? (
          <p className="truncate text-[10px] text-red-300" title={photo.errorMessage}>
            {photo.errorMessage}
          </p>
        ) : photo.auto && photo.analysis ? (
          <p className="truncate text-[10px] text-neutral-500">
            {summarizeAdjustments(photo.auto, strategyLabelFor(photo, settings))}
          </p>
        ) : (
          <p className="text-[10px] text-neutral-600">{STATUS_LABEL[photo.status]}</p>
        )}

        <div className="flex flex-wrap gap-1">
          <Badge tone={STATUS_TONE[photo.status]}>{STATUS_LABEL[photo.status]}</Badge>
          {photo.analysis && settings.mode === "wedding" && (
            <Badge>{WEDDING_CATEGORY_LABELS[photo.analysis.scene.weddingCategory]}</Badge>
          )}
          {photo.analysis && settings.mode !== "wedding" && (
            <Badge>{SCENE_LABELS[photo.analysis.scene.primary]}</Badge>
          )}
          {photo.analysis && photo.analysis.skin.faceCount > 0 && (
            <Badge>{photo.analysis.skin.faceCount} rostro(s)</Badge>
          )}
        </div>
      </div>
    </div>
  );
});

export function PhotoGrid({
  photos,
  settings,
  selectedIds,
  activeId,
  onSelect,
  onOpen,
  onTogglePick,
}: {
  photos: readonly PhotoRecord[];
  settings: ProjectSettings;
  selectedIds: readonly string[];
  activeId: string | null;
  onSelect: (id: string, additive: boolean) => void;
  onOpen: (id: string) => void;
  onTogglePick: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {photos.map((photo) => (
        <PhotoTile
          key={photo.id}
          photo={photo}
          settings={settings}
          selected={selectedIds.includes(photo.id)}
          active={activeId === photo.id}
          onSelect={onSelect}
          onOpen={onOpen}
          onTogglePick={onTogglePick}
        />
      ))}
    </div>
  );
}
