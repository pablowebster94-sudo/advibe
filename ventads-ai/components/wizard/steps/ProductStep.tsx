"use client";

import { CATEGORIES } from "@/lib/catalog/categories";
import { Field, Input, Textarea } from "@/components/ui/Field";
import type { ProductFormState } from "@/lib/wizard-types";

export function ProductStep({
  value,
  onChange,
}: {
  value: ProductFormState;
  onChange: (next: ProductFormState) => void;
}) {
  function set<K extends keyof ProductFormState>(key: K, v: ProductFormState[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Información del producto</h2>
        <p className="text-sm text-muted mt-1">
          Cuéntanos qué vendes. No inventamos características: usamos exactamente lo que
          escribas aquí.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Categoría" required>
          <Input
            list="category-options"
            value={value.category}
            onChange={(e) => set("category", e.target.value)}
            placeholder="Vehículos, muebles, servicios..."
          />
          <datalist id="category-options">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.label} />
            ))}
          </datalist>
        </Field>

        <Field label="Nombre del producto" required>
          <Input
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Trailblazer Premier"
          />
        </Field>

        <Field label="Marca / fabricante" hint="Ej: Chevrolet (no la agencia)">
          <Input
            value={value.manufacturer}
            onChange={(e) => set("manufacturer", e.target.value)}
          />
        </Field>

        <Field label="Modelo / año">
          <Input value={value.model} onChange={(e) => set("model", e.target.value)} />
        </Field>

        <Field label="Precio">
          <Input
            type="number"
            min="0"
            inputMode="decimal"
            value={value.price}
            onChange={(e) => set("price", e.target.value)}
          />
        </Field>

        <Field label="Moneda">
          <Input
            value={value.currency}
            maxLength={3}
            onChange={(e) => set("currency", e.target.value.toUpperCase())}
          />
        </Field>

        <Field
          label="Texto de precio (opcional)"
          hint='Sobrescribe el precio mostrado, ej: "Desde $51.500" o "Consultar"'
        >
          <Input
            value={value.priceLabel}
            onChange={(e) => set("priceLabel", e.target.value)}
          />
        </Field>

        <Field label="CTA preferido" hint='Ej: "Agenda tu prueba de manejo"'>
          <Input value={value.cta} onChange={(e) => set("cta", e.target.value)} />
        </Field>
      </div>

      <Field label="Descripción">
        <Textarea
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Características" hint="Una por línea">
          <Textarea
            value={value.features}
            onChange={(e) => set("features", e.target.value)}
            rows={5}
            placeholder={"Motor 2.8 Turbo Diesel\nAutomática\n4x4"}
          />
        </Field>
        <Field label="Beneficios" hint="Una por línea">
          <Textarea
            value={value.benefits}
            onChange={(e) => set("benefits", e.target.value)}
            rows={5}
            placeholder={"Máxima seguridad para la familia"}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Oferta / promoción vigente">
          <Input value={value.offer} onChange={(e) => set("offer", e.target.value)} />
        </Field>
        <Field label="Público objetivo">
          <Input
            value={value.targetAudience}
            onChange={(e) => set("targetAudience", e.target.value)}
          />
        </Field>
      </div>
    </div>
  );
}
