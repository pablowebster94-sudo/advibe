"use client";

import { OBJECTIVES } from "@/lib/catalog/objectives";
import { SelectableCard } from "@/components/ui/SelectableCard";

export function ObjectiveStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Objetivo publicitario</h2>
        <p className="text-sm text-muted mt-1">
          Define el tono del copy y qué llamado a la acción se prioriza.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OBJECTIVES.map((objective) => (
          <SelectableCard
            key={objective.id}
            label={objective.label}
            description={objective.description}
            selected={value === objective.id}
            onClick={() => onChange(objective.id)}
          />
        ))}
      </div>
    </div>
  );
}
