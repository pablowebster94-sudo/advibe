"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OBJECTIVES, type ObjectiveId } from "@/lib/catalog/objectives";
import { STYLES, type StyleId } from "@/lib/catalog/styles";
import { Button } from "@/components/ui/Button";
import { SelectableCard } from "@/components/ui/SelectableCard";

export function NewCampaignForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [objective, setObjective] = useState<ObjectiveId>(OBJECTIVES[0].id);
  const [style, setStyle] = useState<StyleId>(STYLES[0].id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, objective, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo generar la campaña.");
      router.push(`/results/${data.campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-foreground">Nueva variación</h2>
      <div>
        <p className="mb-2 text-xs text-muted">Objetivo</p>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVES.map((o) => (
            <SelectableCard
              key={o.id}
              label={o.label}
              selected={objective === o.id}
              onClick={() => setObjective(o.id)}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs text-muted">Estilo</p>
        <div className="flex flex-wrap gap-2">
          {STYLES.map((s) => (
            <SelectableCard
              key={s.id}
              label={s.label}
              selected={style === s.id}
              onClick={() => setStyle(s.id)}
              swatch={s.palette.accent}
            />
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={handleSubmit} disabled={submitting} className="self-start">
        {submitting ? "Generando…" : "Generar creatividades"}
      </Button>
    </div>
  );
}
