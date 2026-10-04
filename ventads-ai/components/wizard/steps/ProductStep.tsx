"use client";

import { CATEGORIES } from "@/lib/catalog/categories";
import { Field, Input, Textarea } from "@/components/ui/Field";
import type { ProductFormState } from "@/lib/wizard-types";

function isVehicleCategory(value: string) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return /\bvehiculos?\b|\bautos?\b|\bcamionetas?\b|\bcamiones?\b|\bmotos?\b|\bpickups?\b|\bsedans?\b|\bsuvs?\b/.test(normalized);
}

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

  const isVehicle = isVehicleCategory(value.category);

  function setCategory(category: string) {
    onChange({
      ...value,
      category,
      // Never leak a previous vehicle model into a generic product.
      model: isVehicleCategory(category) ? value.model : "",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">¿Qué vas a promocionar?</h2>
        <p className="text-sm text-muted mt-1">
          Solo necesitamos la información real del producto. VentAds se encarga de convertirla en una propuesta publicitaria.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Categoría" required>
          <Input
            list="category-options"
            value={value.category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Muebles, restaurante, servicios..."
          />
          <datalist id="category-options">
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.label} />
            ))}
          </datalist>
        </Field>

        <Field label="Nombre del producto o servicio" required>
          <Input
            value={value.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ej: Sala Ideal, Menú Ejecutivo, Curso de Inglés..."
          />
        </Field>

        <Field label={isVehicle ? "Marca / fabricante" : "Marca"} hint={isVehicle ? "Ej: Chevrolet" : "Opcional"}>
          <Input
            value={value.manufacturer}
            onChange={(e) => set("manufacturer", e.target.value)}
            placeholder={isVehicle ? "Ej: Chevrolet" : "Ej: Muebles Ideal"}
          />
        </Field>

        {isVehicle && (
          <Field label="Modelo / año" hint="Este campo solo aparece para vehículos">
            <Input
              value={value.model}
              onChange={(e) => set("model", e.target.value)}
              placeholder="Ej: Tracker 2026"
            />
          </Field>
        )}

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
          hint='Ej: "Desde $51.500" o "Consultar"'
        >
          <Input value={value.priceLabel} onChange={(e) => set("priceLabel", e.target.value)} />
        </Field>

        <Field label="CTA preferido" hint='Ej: "Comprar ahora", "Cotizar" o "WhatsApp"'>
          <Input value={value.cta} onChange={(e) => set("cta", e.target.value)} />
        </Field>
      </div>

      <Field label="¿Qué hace especial a este producto?">
        <Textarea
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
          placeholder="Describe brevemente qué vendes y por qué alguien debería considerarlo."
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Características" hint="Una por línea. Solo datos reales.">
          <Textarea
            value={value.features}
            onChange={(e) => set("features", e.target.value)}
            rows={5}
            placeholder={"Material de madera maciza\nTapizado lavable\nEntrega inmediata"}
          />
        </Field>
        <Field label="Beneficios" hint="Una por línea. Qué obtiene el cliente.">
          <Textarea
            value={value.benefits}
            onChange={(e) => set("benefits", e.target.value)}
            rows={5}
            placeholder={"Comodidad para tu hogar\nListo para entrega"}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Oferta / promoción vigente"
          hint='Debe ser concreta: "15% de descuento", "2x1", "Envío gratis".'
        >
          <Input
            value={value.offer}
            onChange={(e) => set("offer", e.target.value)}
            placeholder="15% de descuento"
          />
        </Field>
        <Field label="Público objetivo" hint="Opcional">
          <Input
            value={value.targetAudience}
            onChange={(e) => set("targetAudience", e.target.value)}
            placeholder="Familias, dueños de negocio, estudiantes..."
          />
        </Field>
      </div>
    </div>
  );
}
