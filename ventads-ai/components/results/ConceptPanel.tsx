"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { FORMATS, getFormat } from "@/lib/catalog/formats";
import { getConceptType } from "@/lib/catalog/concepts";
import { Button } from "@/components/ui/Button";
import type { ConceptWithResults, CreativeResult } from "@/lib/types/campaign";

function latestByFormat(creatives: CreativeResult[]) {
  const map = new Map<string, CreativeResult>();
  for (const creative of creatives) {
    const current = map.get(creative.format);
    if (!current || creative.version > current.version) {
      map.set(creative.format, creative);
    }
  }
  return map;
}

export function ConceptPanel({ concept }: { concept: ConceptWithResults }) {
  const [creatives, setCreatives] = useState(concept.creatives);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const availableFormats = useMemo(
    () => FORMATS.filter((f) => creatives.some((c) => c.format === f.id)),
    [creatives]
  );
  const [activeFormat, setActiveFormat] = useState(availableFormats[0]?.id ?? FORMATS[0].id);

  const currentMap = latestByFormat(creatives);
  const active = currentMap.get(activeFormat);
  const conceptType = getConceptType(concept.type);
  const format = getFormat(activeFormat);

  async function handleRegenerate() {
    if (!active) return;
    setRegenerating(active.id);
    try {
      const res = await fetch(`/api/creatives/${active.id}/regenerate`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCreatives((prev) => [data.creative, ...prev]);
      }
    } finally {
      setRegenerating(null);
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
      </div>

      <div className="flex gap-1 rounded-full bg-surface-muted p-1 w-fit">
        {availableFormats.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFormat(f.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium cursor-pointer ${
              activeFormat === f.id
                ? "bg-accent-strong text-white"
                : "text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div
        className="relative mx-auto w-full max-w-xs overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface-muted"
        style={{ aspectRatio: `${format.width} / ${format.height}` }}
      >
        {active?.status === "READY" && active.imageUrl ? (
          <Image
            src={active.imageUrl}
            alt={conceptType.label}
            fill
            sizes="360px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-danger">
            {active?.error ?? "No se pudo generar esta creatividad."}
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
          disabled={!active || regenerating === active.id}
        >
          {regenerating ? "Regenerando…" : "Regenerar"}
        </Button>
        {active?.imageUrl && (
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
