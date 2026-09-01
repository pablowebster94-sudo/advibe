"use client";

import { useEffect, useState } from "react";
import { Field, Input } from "@/components/ui/Field";
import { SelectableCard } from "@/components/ui/SelectableCard";
import { ImageUploader } from "@/components/wizard/ImageUploader";
import type { BrandFormState } from "@/lib/wizard-types";

type SavedBrand = {
  id: string;
  name: string;
  logoKey: string | null;
  defaultCta: string | null;
};

export function BrandStep({
  value,
  onChange,
}: {
  value: BrandFormState;
  onChange: (next: BrandFormState) => void;
}) {
  const [brands, setBrands] = useState<SavedBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => setBrands(data.brands ?? []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof BrandFormState>(key: K, v: BrandFormState[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Identidad de marca</h2>
        <p className="text-sm text-muted mt-1">
          Opcional. Guarda tu marca una vez y reutilízala en próximos productos.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <SelectableCard
          label="Sin marca"
          description="Generar sin logo ni identidad"
          selected={value.mode === "none"}
          onClick={() => set("mode", "none")}
        />
        <SelectableCard
          label="Usar marca guardada"
          description={loading ? "Cargando..." : `${brands.length} disponibles`}
          selected={value.mode === "existing"}
          onClick={() => set("mode", "existing")}
        />
        <SelectableCard
          label="Nueva marca"
          description="Logo, colores y contacto"
          selected={value.mode === "new"}
          onClick={() => set("mode", "new")}
        />
      </div>

      {value.mode === "existing" && (
        <div className="flex flex-wrap gap-3">
          {brands.length === 0 && !loading && (
            <p className="text-sm text-muted">Todavía no guardaste ninguna marca.</p>
          )}
          {brands.map((brand) => (
            <SelectableCard
              key={brand.id}
              label={brand.name}
              selected={value.existingBrandId === brand.id}
              onClick={() => set("existingBrandId", brand.id)}
            />
          ))}
        </div>
      )}

      {value.mode === "new" && (
        <div className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-border p-4">
          <Field label="Nombre de la marca" required>
            <Input value={value.name} onChange={(e) => set("name", e.target.value)} />
          </Field>

          <ImageUploader
            label="Logo"
            folder="brands"
            multiple={false}
            images={value.logo ? [value.logo] : []}
            onChange={(images) => set("logo", images[0] ?? null)}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="CTA por defecto">
              <Input
                value={value.defaultCta}
                onChange={(e) => set("defaultCta", e.target.value)}
              />
            </Field>
            <Field label="Sitio web">
              <Input value={value.website} onChange={(e) => set("website", e.target.value)} />
            </Field>
            <Field label="Teléfono de contacto">
              <Input
                value={value.contactPhone}
                onChange={(e) => set("contactPhone", e.target.value)}
              />
            </Field>
            <Field label="Email de contacto">
              <Input
                type="email"
                value={value.contactEmail}
                onChange={(e) => set("contactEmail", e.target.value)}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
