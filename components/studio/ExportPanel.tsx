"use client";

import { useState } from "react";
import type { PhotoRecord, ProjectRecord } from "@/lib/photo/types";
import {
  type ExportSelection,
  JPEG_PRESETS,
  buildSidecar,
  downloadBlob,
  exportZip,
  slugify,
} from "@/lib/photo/export";
import { effectiveAdjustments } from "@/lib/photo/pipeline";
import { hasOriginal, reattachOriginals } from "@/lib/photo/storage/originals";
import { formatBytes } from "@/lib/photo/jobs/queue";
import { Button, Notice, Panel, ProgressBar } from "./ui";

type Scope = "all" | "picked" | "selected";

export function ExportPanel({
  project,
  photos,
  selectedIds,
}: {
  project: ProjectRecord;
  photos: readonly PhotoRecord[];
  selectedIds: readonly string[];
}) {
  const [scope, setScope] = useState<Scope>("all");
  const [wantXmp, setWantXmp] = useState(true);
  const [wantJpeg, setWantJpeg] = useState(false);
  const [preset, setPreset] = useState<keyof typeof JPEG_PRESETS>("full");
  const [quality, setQuality] = useState(JPEG_PRESETS.full.quality);
  const [attachNote, setAttachNote] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, currentName: "" });
  const [result, setResult] = useState<string | null>(null);
  const [failures, setFailures] = useState<Array<{ fileName: string; message: string }>>([]);

  // Only photographs that actually have adjustments can be exported. A file
  // whose pixels the browser could not decode has metadata but no adjustments,
  // so it is left out -- and said so, rather than silently missing from the ZIP.
  const editable = photos.filter((photo) => photo.auto);
  const skipped = photos.length - editable.length;
  // File handles do not survive a reload, and without the original there are no
  // full-resolution pixels to export. Counted so the panel can offer to
  // re-attach them instead of quietly shipping smaller JPEGs.
  const missingOriginals = editable.filter((photo) => !hasOriginal(photo.id, photo.fileName)).length;
  const target =
    scope === "picked"
      ? editable.filter((photo) => photo.picked)
      : scope === "selected"
        ? editable.filter((photo) => selectedIds.includes(photo.id))
        : editable;

  const run = async () => {
    if (target.length === 0 || (!wantXmp && !wantJpeg)) return;
    setRunning(true);
    setResult(null);
    setFailures([]);
    setProgress({ completed: 0, total: target.length, currentName: "" });

    try {
      const selection: ExportSelection = {
        xmp: wantXmp,
        jpeg: wantJpeg,
        jpegOptions: { ...JPEG_PRESETS[preset], quality },
        useFolders: wantXmp && wantJpeg,
      };
      const output = await exportZip(project, target, selection, setProgress);
      downloadBlob(output.blob, `${slugify(project.name)}-advibe.zip`);
      setFailures(output.failures);
      // State the dimensions actually produced, so "resolución completa" is a
      // checked fact in front of the photographer, not a promise.
      const sizes = output.exported;
      const allFull =
        sizes.length > 0 &&
        sizes.every((item) => item.width === item.sourceWidth && item.height === item.sourceHeight);
      const largest = sizes.reduce(
        (best, item) => (item.width * item.height > best.width * best.height ? item : best),
        sizes[0] ?? { width: 0, height: 0 },
      );
      setResult(
        `${output.fileCount} archivo(s) · ${formatBytes(output.blob.size)}. La descarga debería haber comenzado.` +
          (sizes.length > 0
            ? ` JPG a ${largest.width}×${largest.height}${allFull ? ", igual que el original" : ""}.`
            : ""),
      );
    } catch (error) {
      setResult(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  };

  /** Single-file path, so one sidecar does not require building a ZIP. */
  const downloadSingleXmp = (photo: PhotoRecord) => {
    const adjustments = effectiveAdjustments(photo);
    if (!adjustments) return;
    const sidecar = buildSidecar(photo, adjustments);
    downloadBlob(new Blob([sidecar.content], { type: "application/rdf+xml" }), sidecar.name);
  };

  return (
    <div className="space-y-4">
      <Panel title="Qué exportar">
        <div className="space-y-4">
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-wider text-neutral-500">
              Fotografías
            </legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", `Todas (${editable.length})`],
                  ["picked", `Seleccionadas ★ (${editable.filter((p) => p.picked).length})`],
                  ["selected", `Marcadas en la rejilla (${selectedIds.length})`],
                ] as Array<[Scope, string]>
              ).map(([value, label]) => (
                <label
                  key={value}
                  className={`min-h-11 cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                    scope === value
                      ? "border-[#78d94f] bg-[#78d94f]/10 text-[#a4ef84]"
                      : "border-neutral-700 text-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="scope"
                    className="sr-only"
                    checked={scope === value}
                    onChange={() => setScope(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="mb-1 text-xs uppercase tracking-wider text-neutral-500">
              Formatos
            </legend>
            <label className="flex min-h-11 items-start gap-3 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={wantXmp}
                onChange={(event) => setWantXmp(event.target.checked)}
                className="mt-1 size-4 accent-[#78d94f]"
              />
              <span>
                <strong>Archivos .xmp</strong> para Lightroom Classic
                <span className="block text-xs text-neutral-500">
                  Calidad total: llevan la edición al RAW original sin tocarlo.
                </span>
              </span>
            </label>
            <label className="flex min-h-11 items-start gap-3 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={wantJpeg}
                onChange={(event) => setWantJpeg(event.target.checked)}
                className="mt-1 size-4 accent-[#78d94f]"
              />
              <span>
                <strong>Archivos .jpg</strong> revelados aquí
                <span className="block text-xs text-neutral-500">
                  Con «Resolución completa» salen con las mismas dimensiones que el original, con
                  todos los ajustes aplicados sobre esos píxeles.
                </span>
              </span>
            </label>
          </fieldset>

          {wantJpeg && (
            <div className="space-y-3 rounded-lg border border-neutral-800 p-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(JPEG_PRESETS).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setPreset(key as keyof typeof JPEG_PRESETS);
                      setQuality(value.quality);
                    }}
                    className={`min-h-11 rounded-lg border px-3 text-sm ${
                      preset === key
                        ? "border-[#78d94f] text-[#a4ef84]"
                        : "border-neutral-700 text-neutral-300"
                    }`}
                  >
                    {value.label}
                  </button>
                ))}
              </div>
              <div>
                <div className="flex justify-between text-xs text-neutral-400">
                  <span>Calidad JPG</span>
                  <span className="tabular-nums">{Math.round(quality * 100)}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1}
                  step={0.01}
                  value={quality}
                  onChange={(event) => setQuality(Number(event.target.value))}
                  className="advibe-slider w-full"
                  style={{ ["--fill" as string]: `${((quality - 0.5) / 0.5) * 100}%` }}
                  aria-label="Calidad JPG"
                />
              </div>

              {preset === "full" && missingOriginals > 0 && (
                <div className="rounded-lg border border-amber-900/60 bg-amber-950/20 p-3">
                  <p className="text-xs leading-relaxed text-amber-200">
                    {missingOriginals} fotografía(s) no tienen su archivo original disponible en
                    esta sesión (se pierde al recargar la página). Sin él solo se puede exportar
                    desde la previsualización almacenada, a menor resolución.
                  </p>
                  <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-neutral-700 px-3 text-sm text-neutral-200">
                    Volver a adjuntar originales
                    <input
                      type="file"
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        const files = [...(event.target.files ?? [])];
                        if (files.length === 0) return;
                        const matched = reattachOriginals(files, editable);
                        setAttachNote(
                          `${matched} de ${editable.length} fotografía(s) con su original disponible.`,
                        );
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {attachNote && <p className="mt-2 text-xs text-neutral-300">{attachNote}</p>}
                </div>
              )}
            </div>
          )}

          <Button
            variant="primary"
            onClick={run}
            disabled={running || target.length === 0 || (!wantXmp && !wantJpeg)}
          >
            {running ? "Exportando…" : `Exportar ZIP (${target.length})`}
          </Button>

          {running && (
            <div className="space-y-1">
              <ProgressBar value={progress.completed} total={progress.total} />
              <p className="truncate text-xs text-neutral-500">
                {progress.completed}/{progress.total} · {progress.currentName}
              </p>
            </div>
          )}

          {result && <Notice tone="info">{result}</Notice>}
          {failures.length > 0 && (
            <Notice tone="warn">
              {failures.length} incidencia(s):{" "}
              {failures.slice(0, 3).map((failure) => `${failure.fileName}: ${failure.message}`).join(" · ")}
            </Notice>
          )}
        </div>
      </Panel>

      <Panel title="Descarga individual">
        <p className="mb-3 text-xs text-neutral-500">
          Un .xmp suelto, sin pasar por el ZIP.
        </p>
        {skipped > 0 && (
          <p className="mb-3 text-xs text-amber-300">
            {skipped} fotografía(s) quedan fuera de la exportación porque no se pudieron
            decodificar sus píxeles y por tanto no tienen ajustes que escribir.
          </p>
        )}
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {editable.slice(0, 200).map((photo) => (
            <div
              key={photo.id}
              className="flex items-center justify-between gap-2 rounded border border-neutral-800 px-2 py-1"
            >
              <span className="truncate font-mono text-xs text-neutral-300">{photo.fileName}</span>
              <Button
                variant="ghost"
                className="min-h-11 px-4 text-[11px]"
                onClick={() => downloadSingleXmp(photo)}
                data-testid={`download-xmp-${photo.baseName}`}
              >
                .xmp
              </Button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
