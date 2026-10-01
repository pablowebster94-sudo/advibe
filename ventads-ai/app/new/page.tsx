"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ImageUploader, type UploadedImage } from "@/components/wizard/ImageUploader";
import { readJson } from "@/lib/fetch-json";

/**
 * Quick ad: one screen, four fields. Everything else (objective, style,
 * brand, copy) takes sensible defaults or is reused from last time; the
 * full 6-step wizard stays available at /new/avanzado.
 */

type Brand = { id: string; name: string; contactPhone: string | null };

const KINDS = [
  { id: "Vehículos", label: "Vehículo" },
  { id: "Productos de retail", label: "Producto" },
  { id: "Servicios", label: "Servicio" },
] as const;

const LOOKS = [
  { id: "COMERCIAL", label: "Claro" },
  { id: "PREMIUM", label: "Oscuro premium" },
] as const;

const LAST_BRAND_KEY = "ventads:last-brand";

function remembered(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function remember(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage: nothing to remember, nothing breaks.
  }
}

/** One selling point per line; "a, b, c" on one line also works. */
function toLines(text: string) {
  return text
    .split(/\n|,\s+|\s+·\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n");
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`rounded-full border px-4 py-2 text-sm cursor-pointer transition-colors ${
            value === option.id
              ? "border-accent-strong bg-accent-strong text-white"
              : "border-border bg-surface text-foreground hover:border-accent-strong/60"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function QuickAdPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<UploadedImage[]>([]);
  const [kind, setKind] = useState<string>(KINDS[0].id);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [details, setDetails] = useState("");
  const [look, setLook] = useState<string>(LOOKS[0].id);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState<string>("");
  const [businessName, setBusinessName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/brands")
      .then((res) => readJson<{ brands?: Brand[] }>(res))
      .then((data) => {
        const list = data.brands ?? [];
        setBrands(list);
        const saved = remembered(LAST_BRAND_KEY);
        const preferred = list.find((b) => b.id === saved) ?? list[0];
        if (preferred) setBrandId(preferred.id);
      })
      .catch(() => setBrands([]));
  }, []);

  const canGenerate = name.trim() !== "" && !submitting;

  async function generate() {
    setSubmitting(true);
    setError(null);
    try {
      let useBrandId = brandId === "new" ? "" : brandId;
      if ((brandId === "new" || brands.length === 0) && (businessName.trim() || whatsapp.trim())) {
        const res = await fetch("/api/brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: businessName.trim() || "Mi negocio",
            contactPhone: whatsapp.trim() || undefined,
            defaultCta: whatsapp.trim() ? "Escríbenos por WhatsApp" : undefined,
          }),
        });
        const data = await readJson<{ error?: string; brand: { id: string } }>(res);
        if (!res.ok) throw new Error(data.error ?? "No se pudo guardar tu negocio.");
        useBrandId = data.brand.id;
      }
      if (useBrandId) remember(LAST_BRAND_KEY, useBrandId);

      const numericPrice = Number(price.replace(/[^\d.]/g, ""));
      const productRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: kind,
          name: name.trim(),
          price: price.trim() && numericPrice > 0 ? numericPrice : undefined,
          currency: "USD",
          features: details.trim() ? toLines(details) : undefined,
          brandId: useBrandId || undefined,
          images: photos.map((img) => ({ ...img, role: "PRODUCT" as const })),
        }),
      });
      const productData = await readJson<{ error?: string; product: { id: string } }>(productRes);
      if (!productRes.ok) throw new Error(productData.error ?? "No se pudo guardar el producto.");

      const campaignRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: productData.product.id, objective: "VENDER", style: look }),
      });
      const campaignData = await readJson<{ error?: string; campaign: { id: string } }>(campaignRes);
      if (!campaignRes.ok) throw new Error(campaignData.error ?? "No se pudieron generar los anuncios.");

      router.push(`/results/${campaignData.campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setSubmitting(false);
    }
  }

  const showNewBusiness = brands.length === 0 || brandId === "new";

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          ventADS<span className="text-accent-strong">.ai</span>
        </Link>
        <Link href="/products" className="text-sm text-muted hover:text-foreground">
          Mis productos
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Nuevo anuncio</h1>
        <p className="mt-1 text-sm text-muted">
          Sube la foto, escribe qué vendes y listo. Usamos tu producto real, tal cual está en la foto.
        </p>
      </div>

      <form
        className="flex flex-col gap-5 rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          if (canGenerate) void generate();
        }}
      >
        <ImageUploader
          images={photos}
          onChange={setPhotos}
          folder="products"
          label="Foto del producto"
          hint="Mejor si se ve completo, sin cortes en los bordes. La primera foto es la que se usa."
        />

        <Chips options={KINDS} value={kind} onChange={setKind} />

        <Field label="¿Qué vendes?" required>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === "Vehículos" ? "Ej: Chevrolet Blazer RS 2021" : "Ej: Sala modular 3 piezas"}
            autoFocus
          />
        </Field>

        <Field label="Precio (USD)" hint="Opcional. Déjalo vacío si prefieres «Consultar».">
          <Input
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Ej: 38900"
          />
        </Field>

        <Field label="Detalles que quieres destacar" hint="Opcional. Solo datos reales: separados por coma o uno por línea.">
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder={kind === "Vehículos" ? "Único dueño, 30.000 km, full equipo" : "Envío gratis, garantía de 1 año"}
            className="min-h-20"
          />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Estilo</span>
          <Chips options={LOOKS} value={look} onChange={setLook} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground">Tu negocio</span>
          {brands.length > 0 && (
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                  {b.contactPhone ? ` · ${b.contactPhone}` : ""}
                </option>
              ))}
              <option value="">Sin marca</option>
              <option value="new">+ Otro negocio…</option>
            </select>
          )}
          {showNewBusiness && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Nombre (opcional)"
              />
              <Input
                inputMode="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp (opcional)"
              />
            </div>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" disabled={!canGenerate}>
          {submitting ? "Creando tus anuncios…" : "Crear 3 anuncios"}
        </Button>
      </form>

      <p className="text-center text-xs text-muted">
        ¿Necesitas objetivo, público, logo u oferta?{" "}
        <Link href="/new/avanzado" className="underline hover:text-foreground">
          Modo avanzado
        </Link>
      </p>
    </div>
  );
}
