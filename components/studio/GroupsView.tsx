"use client";

import { useEffect, useState } from "react";
import type { DuplicateGroup, PhotoRecord } from "@/lib/photo/types";
import * as db from "@/lib/photo/storage/db";
import { Badge, Button, EmptyState, Notice } from "./ui";

function useThumb(photoId: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
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
  }, [photoId]);
  return url;
}

function GroupMember({
  photo,
  suggested,
  onOpen,
  onPick,
  score,
}: {
  photo: PhotoRecord;
  suggested: boolean;
  onOpen: () => void;
  onPick: () => void;
  score: string;
}) {
  const url = useThumb(photo.id);
  return (
    <div
      className={`overflow-hidden rounded-lg border ${
        suggested ? "border-[#78d94f]" : "border-neutral-800"
      }`}
    >
      <button type="button" onClick={onOpen} className="advibe-canvas-bg block aspect-[3/2] w-full">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={photo.fileName} className="h-full w-full object-contain" />
        ) : (
          <span className="text-[11px] text-neutral-600">…</span>
        )}
      </button>
      <div className="space-y-1 bg-neutral-900/80 px-2 py-1.5">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate font-mono text-[11px] text-neutral-300">{photo.fileName}</span>
          {suggested && <Badge tone="accent">Mejor</Badge>}
        </div>
        <p className="text-[10px] leading-relaxed text-neutral-500">{score}</p>
        <Button
          variant={photo.picked ? "primary" : "ghost"}
          className="h-8 min-h-8 w-full text-[11px]"
          onClick={onPick}
        >
          {photo.picked ? "★ Seleccionada" : "Seleccionar esta"}
        </Button>
      </div>
    </div>
  );
}

export function GroupsView({
  groups,
  photos,
  onOpen,
  onPick,
  onRebuild,
}: {
  groups: readonly DuplicateGroup[];
  photos: readonly PhotoRecord[];
  onOpen: (photoId: string) => void;
  onPick: (photoId: string) => void;
  onRebuild: () => void;
}) {
  const byId = new Map(photos.map((photo) => [photo.id, photo]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-400">
          {groups.length === 0
            ? "No se han encontrado fotografías prácticamente idénticas."
            : `${groups.length} grupo(s) de fotografías casi idénticas.`}
        </p>
        <Button variant="secondary" onClick={onRebuild}>
          Recalcular grupos
        </Button>
      </div>

      <Notice>
        La recomendación se basa en <strong>nitidez general, foco del rostro, exposición y
        encuadre</strong>. No se analiza si los ojos están abiertos ni la expresión: eso no se
        mide, así que no se afirma. Nunca se borra nada automáticamente.
      </Notice>

      {groups.length === 0 ? (
        <EmptyState
          title="Sin duplicados"
          description="Se comparan huellas perceptuales (dHash y aHash) y la hora de captura. Las fotos de una misma ráfaga aparecerán aquí agrupadas."
        />
      ) : (
        groups.map((group) => (
          <section key={group.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-3">
            <header className="mb-2 flex items-center justify-between gap-2">
              <h3 className="font-mono text-sm font-semibold text-neutral-200">{group.label}</h3>
              <span className="text-xs text-neutral-500">{group.photoIds.length} fotografías</span>
            </header>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {group.photoIds.map((photoId) => {
                const photo = byId.get(photoId);
                if (!photo) return null;
                return (
                  <GroupMember
                    key={photoId}
                    photo={photo}
                    suggested={group.suggestedId === photoId}
                    score={group.scores[photoId]?.summary ?? ""}
                    onOpen={() => onOpen(photoId)}
                    onPick={() => onPick(photoId)}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
