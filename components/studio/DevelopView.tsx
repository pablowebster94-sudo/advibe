"use client";

/**
 * Develop view: the before/after comparison, the generated values and the
 * manual controls, plus keyboard navigation for culling at speed.
 */
import { useCallback, useEffect, useState } from "react";
import type { Adjustments, PhotoRecord, ProjectSettings } from "@/lib/photo/types";
import { SCENE_LABELS, STRATEGIES, WEDDING_CATEGORY_LABELS } from "@/lib/photo/editing/strategies";
import { estimateAsShotKelvin } from "@/lib/photo/raw/exif";
import { strategyLabelFor } from "@/lib/photo/pipeline";
import { DevelopCanvas } from "./DevelopCanvas";
import { AdjustmentPanel } from "./AdjustmentPanel";
import { Badge, Button, Notice, Panel } from "./ui";

export function DevelopView({
  photo,
  photos,
  settings,
  adjustments,
  selectedIds,
  onNavigate,
  onChange,
  onReset,
  onReapply,
  onCopy,
  onSync,
  onTogglePick,
  onToggleReject,
}: {
  photo: PhotoRecord;
  photos: readonly PhotoRecord[];
  settings: ProjectSettings;
  adjustments: Adjustments | null;
  selectedIds: readonly string[];
  onNavigate: (delta: number) => void;
  onChange: (patch: Partial<Adjustments>) => void;
  onReset: () => void;
  onReapply: (strategyOverride?: string) => void;
  onCopy: () => void;
  onSync: () => void;
  onTogglePick: () => void;
  onToggleReject: () => void;
}) {
  const [compare, setCompare] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);

  // Reset the zoom when the photographer moves to another photo. Adjusting
  // state during render is React's documented pattern for "derive from a prop
  // change"; an effect here would render the new photo at the old zoom first.
  const [zoomedPhotoId, setZoomedPhotoId] = useState(photo.id);
  if (zoomedPhotoId !== photo.id) {
    setZoomedPhotoId(photo.id);
    setZoom(1);
  }

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      switch (event.key) {
        case "ArrowRight":
          onNavigate(1);
          break;
        case "ArrowLeft":
          onNavigate(-1);
          break;
        case "p":
        case "P":
          onTogglePick();
          break;
        case "x":
        case "X":
          onToggleReject();
          break;
        case "\\":
          // Hold-to-compare, the shortcut Lightroom users already have in muscle memory.
          setCompare((current) => (current === 1 ? 0 : 1));
          break;
        case "f":
        case "F":
          setFullscreen((current) => !current);
          break;
        case "Escape":
          setFullscreen(false);
          break;
        default:
          return;
      }
      event.preventDefault();
    },
    [onNavigate, onTogglePick, onToggleReject],
  );

  useEffect(() => {
    globalThis.addEventListener("keydown", handleKey);
    return () => globalThis.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const index = photos.findIndex((item) => item.id === photo.id);
  const analysis = photo.analysis;
  const kelvin = analysis ? estimateAsShotKelvin(photo.exif) : null;

  const canvas = (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-black p-2" : "h-[46vh] min-h-64 lg:h-[62vh]"}>
      <DevelopCanvas
        photoId={photo.id}
        adjustments={adjustments}
        compare={compare}
        zoom={zoom}
        onZoomChange={setZoom}
      />
      {fullscreen && (
        <Button
          variant="secondary"
          className="absolute right-4 top-4"
          onClick={() => setFullscreen(false)}
        >
          Salir (Esc)
        </Button>
      )}
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-3">
        {canvas}

        <div className="space-y-2 rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
          <div className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs text-neutral-500">Antes</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={compare}
              onChange={(event) => setCompare(Number(event.target.value))}
              className="advibe-slider advibe-compare-handle w-full"
              style={{ ["--fill" as string]: `${compare * 100}%` }}
              aria-label="Comparar antes y después"
            />
            <span className="w-16 shrink-0 text-right text-xs text-neutral-500">Después</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => onNavigate(-1)} disabled={index <= 0}>
              ← Anterior
            </Button>
            <Button
              variant="ghost"
              onClick={() => onNavigate(1)}
              disabled={index >= photos.length - 1}
            >
              Siguiente →
            </Button>
            <span className="px-1 text-xs tabular-nums text-neutral-500">
              {index + 1} / {photos.length}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" onClick={() => setZoom(1)} disabled={zoom === 1}>
                Ajustar
              </Button>
              <Button variant="ghost" onClick={() => setZoom(2)}>
                100 %
              </Button>
              <Button variant="ghost" onClick={() => setFullscreen(true)}>
                Pantalla completa
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant={photo.picked ? "primary" : "secondary"} onClick={onTogglePick}>
              ★ Seleccionar
            </Button>
            <Button variant={photo.rejected ? "danger" : "ghost"} onClick={onToggleReject}>
              ✕ Descartar
            </Button>
            <span className="text-[11px] text-neutral-600">
              Teclas: ← → navegar · P seleccionar · X descartar · \ comparar · F pantalla completa
            </span>
          </div>
        </div>

        {analysis && (
          <Panel title="Lo que midió la IA">
            <div className="grid gap-3 sm:grid-cols-2">
              <dl className="space-y-1 text-xs">
                <Row label="Estrategia" value={strategyLabelFor(photo, settings)} />
                <Row label="Escena" value={analysis.scene.tags.map((tag) => SCENE_LABELS[tag]).join(", ")} />
                {settings.mode === "wedding" && (
                  <Row
                    label="Momento"
                    value={WEDDING_CATEGORY_LABELS[analysis.scene.weddingCategory]}
                  />
                )}
                <Row
                  label="Exposición"
                  value={`media ${(analysis.tone.mean * 100).toFixed(0)}% · contraste ${(analysis.tone.stdDev * 100).toFixed(0)}%`}
                />
                <Row
                  label="Recorte"
                  value={`${(analysis.tone.highlightClipping * 100).toFixed(1)}% luces · ${(analysis.tone.unrecoverableHighlights * 100).toFixed(1)}% sin recuperar`}
                />
                <Row label="Nitidez" value={`${(analysis.sharpness * 100).toFixed(0)}%`} />
                <Row label="Ruido" value={`${(analysis.noise * 100).toFixed(0)}%`} />
              </dl>
              <dl className="space-y-1 text-xs">
                <Row
                  label="Piel"
                  value={
                    analysis.skin.coverage > 0.005
                      ? `${(analysis.skin.coverage * 100).toFixed(0)}% del cuadro · tono ${analysis.skin.meanHue?.toFixed(0)}° · ${analysis.skin.cast}`
                      : "sin piel detectada"
                  }
                />
                <Row
                  label="Rostros"
                  value={`${analysis.skin.faceCount} (${
                    analysis.skin.detector === "native-shape-detection"
                      ? "detector del navegador"
                      : analysis.skin.detector === "skin-region-heuristic"
                        ? "heurística de regiones de piel"
                        : "sin detección"
                  })`}
                />
                {kelvin && (
                  <Row
                    label="Balance origen"
                    value={`≈ ${kelvin.kelvin} K (estimado desde EXIF)`}
                  />
                )}
                <Row label="ISO" value={photo.exif.iso ? String(photo.exif.iso) : "—"} />
                <Row
                  label="Cámara"
                  value={[photo.exif.make, photo.exif.model].filter(Boolean).join(" ") || "—"}
                />
                <Row label="Objetivo" value={photo.exif.lensModel ?? "—"} />
                <Row label="Calidad" value={`${(analysis.quality * 100).toFixed(0)}%`} />
              </dl>
            </div>

            {analysis.exposure.notes.length > 0 && (
              <ul className="mt-3 space-y-1">
                {analysis.exposure.notes.map((note) => (
                  <li key={note} className="text-xs leading-relaxed text-amber-300/90">
                    • {note}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-500">Forzar estrategia:</span>
              {Object.values(STRATEGIES).map((strategy) => (
                <button
                  key={strategy.id}
                  type="button"
                  onClick={() => onReapply(strategy.id)}
                  title={strategy.intent}
                  className="rounded border border-neutral-700 px-2 py-1 text-[11px] text-neutral-300 transition-colors hover:border-[#78d94f] hover:text-[#a4ef84]"
                >
                  {strategy.label}
                </button>
              ))}
            </div>
          </Panel>
        )}
      </div>

      <aside className="space-y-3">
        <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-3">
          <h2 className="truncate font-mono text-sm text-neutral-200">{photo.fileName}</h2>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Badge>{photo.format.toUpperCase()}</Badge>
            {photo.exif.width && (
              <Badge>{`${photo.exif.width} × ${photo.exif.height}`}</Badge>
            )}
            <Badge tone={photo.manual ? "accent" : "neutral"}>
              {photo.manual ? "Editada a mano" : "Ajustes de la IA"}
            </Badge>
          </div>
        </div>

        {adjustments ? (
          <AdjustmentPanel
            adjustments={adjustments}
            manual={photo.manual}
            edit={photo.auto}
            onChange={onChange}
            onReset={onReset}
            onReapply={() => onReapply()}
            onCopy={onCopy}
            onSync={onSync}
            syncCount={selectedIds.length}
          />
        ) : (
          <Notice tone="warn">
            {photo.status === "error"
              ? photo.errorMessage
              : "Esta fotografía todavía no tiene ajustes generados."}
          </Notice>
        )}
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-neutral-300">{value}</dd>
    </div>
  );
}
