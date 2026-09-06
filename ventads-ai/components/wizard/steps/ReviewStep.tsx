"use client";

import { getConceptType, CONCEPT_TYPES } from "@/lib/catalog/concepts";
import { OBJECTIVES } from "@/lib/catalog/objectives";
import { STYLES } from "@/lib/catalog/styles";
import { Button } from "@/components/ui/Button";
import type { WizardState } from "@/lib/wizard-types";

export function ReviewStep({
  state,
  onGenerate,
  submitting,
  error,
}: {
  state: WizardState;
  onGenerate: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const objective = OBJECTIVES.find((o) => o.id === state.objective);
  const style = STYLES.find((s) => s.id === state.style);
  const brandLabel =
    state.brand.mode === "new"
      ? state.brand.name || "Nueva marca"
      : state.brand.mode === "existing"
        ? "Marca guardada"
        : "Sin marca";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Generar creatividades</h2>
        <p className="text-sm text-muted mt-1">
          ventADS.ai analizará el producto y generará {CONCEPT_TYPES.length} conceptos
          publicitarios en los formatos disponibles.
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-[var(--radius-md)] border border-border bg-surface p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted">Producto</dt>
          <dd className="text-sm font-medium text-foreground">
            {[state.product.manufacturer, state.product.name, state.product.model]
              .filter(Boolean)
              .join(" ") || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Fotos</dt>
          <dd className="text-sm font-medium text-foreground">
            {state.productImages.length} foto(s) de producto
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Marca</dt>
          <dd className="text-sm font-medium text-foreground">{brandLabel}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Objetivo</dt>
          <dd className="text-sm font-medium text-foreground">{objective?.label}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Estilo</dt>
          <dd className="text-sm font-medium text-foreground">{style?.label}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        {CONCEPT_TYPES.map((concept) => (
          <span
            key={concept.id}
            className="rounded-full bg-surface-muted px-3 py-1 text-xs text-muted"
          >
            {getConceptType(concept.id).label}
          </span>
        ))}
      </div>

      {error && (
        <p className="rounded-[var(--radius-sm)] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Button size="lg" onClick={onGenerate} disabled={submitting} className="self-start">
        {submitting ? "Generando…" : "Generar creatividades"}
      </Button>
    </div>
  );
}
