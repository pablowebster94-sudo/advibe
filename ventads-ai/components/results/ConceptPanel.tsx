"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FORMATS, getFormat } from "@/lib/catalog/formats";
import { getConceptType } from "@/lib/catalog/concepts";
import { Button } from "@/components/ui/Button";
import { latestCreativesByFormat } from "@/lib/results-helpers";
import type { ConceptWithResults } from "@/lib/types/campaign";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "En cola",
  PROCESSING: "Generando",
  COMPLETED: "Lista",
  FAILED: "Falló",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "bg-surface-muted text-muted",
  PROCESSING: "bg-accent-soft text-accent-strong",
  COMPLETED: "bg-success/10 text-success",
  FAILED: "bg-danger/10 text-danger",
};

function Spinner() {
  return (
    <span
      className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-transparent"
      aria-hidden
    />
  );
}

/**
 * Reads directly from the `concept` prop — no independent local state for
 * the creatives themselves. ResultsView owns polling and re-renders this
 * with fresh data every tick; a "Regenerar" click doesn't optimistically
 * patch local state, it just waits for the next poll tick to reflect the
 * new PENDING row, which keeps this component a pure function of its prop.
 */
export function ConceptPanel({ concept }: { concept: ConceptWithResults }) {
  const [regenerating, setRegenerating] = useState(false);

  const latest = useMemo(() => latestCreativesByFormat(concept.creatives), [concept.creatives]);
  const availableFormats = useMemo(
    () => FORMATS.filter((f) => latest.some((c) => c.format === f.id)),
    [latest]
  );
  const [activeFormat, setActiveFormat] = useState(availableFormats[0]?.id ?? FORMATS[0].id);

  const active = latest.find((c) => c.format === activeFormat) ?? latest[0];
  const conceptType = getConceptType(concept.type);
  const format = getFormat(activeFormat);
  const busy = active?.status === "PENDING" || active?.status === "PROCESSING";

  async function handleRegenerate() {
    if (!active) return;
    setRegenerating(true);
    try {
      await fetch(`/api/creatives/${active.id}/regenerate`, { method: "POST" });
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{conceptType.label}</h3>
          {concept.rationale && (
            <p className="mt-0.5 text-xs text-muted">{concept.rationale}</p>
          )}
        </div>
        {active && (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE_CLASS[active.status] ?? ""}`}
          >
            {STATUS_LABEL[active.status] ?? active.status}
          </span>
        )}
      </div>

      <div className="flex gap-1 rounded-full bg-surface-muted p-1 w-fit">
        {availableFormats.map((f) => {
          const creative = latest.find((c) => c.format === f.id);
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveFormat(f.id)}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
                activeFormat === f.id
                  ? "bg-accent-strong text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {f.label}
              {creative?.status === "FAILED" && (
                <span className="h-1.5 w-1.5 rounded-full bg-danger" aria-hidden />
              )}
              {(creative?.status === "PENDING" || creative?.status === "PROCESSING") && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent-strong" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      <div
        className="relative mx-auto w-full max-w-xs overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted"
        style={{ aspectRatio: `${format.width} / ${format.height}` }}
      >
        {active?.status === "COMPLETED" && active.imageUrl ? (
          <Image
            src={active.imageUrl}
            alt={conceptType.label}
            fill
            sizes="360px"
            className="object-cover"
          />
        ) : active?.status === "FAILED" ? (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-danger">
            {active.error ?? "No se pudo generar esta creatividad."}
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-muted">
            <Spinner />
            <span>{active?.status === "PROCESSING" ? "Generando…" : "En cola…"}</span>
          </div>
        )}
      </div>

      {concept.copy && (
        <div className="flex flex-col gap-1 rounded-[var(--radius-sm)] bg-surface-muted p-3 text-xs">
          <p className="font-semibold text-foreground">{concept.copy.headline}</p>
          <p className="text-muted">{concept.copy.primaryText}</p>
          <p className="text-accent-strong font-medium">{concept.copy.cta}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRegenerate}
          disabled={!active || regenerating || busy}
        >
          {regenerating ? "Iniciando…" : active?.status === "FAILED" ? "Reintentar" : "Regenerar"}
        </Button>
        {active?.status === "COMPLETED" && active.imageUrl && (
          <a
            href={`${active.imageUrl}?download=${conceptType.id}-${format.id}.png`}
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border bg-surface px-4 py-1.5 text-sm font-medium text-foreground hover:border-accent-strong"
          >
            Descargar
          </a>
        )}
      </div>
    </div>
  );
}
