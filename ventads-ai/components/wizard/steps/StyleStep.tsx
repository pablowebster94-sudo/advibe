"use client";

import { STYLES } from "@/lib/catalog/styles";
import { SelectableCard } from "@/components/ui/SelectableCard";

export function StyleStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Estilo visual</h2>
        <p className="text-sm text-muted mt-1">
          Define la paleta y el tono visual de las creatividades.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STYLES.map((style) => (
          <SelectableCard
            key={style.id}
            label={style.label}
            description={style.description}
            selected={value === style.id}
            onClick={() => onChange(style.id)}
            swatch={style.palette.accent}
          />
        ))}
      </div>
    </div>
  );
}
