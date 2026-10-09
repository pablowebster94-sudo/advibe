"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { ImageUploader, type UploadedImage } from "@/components/wizard/ImageUploader";
import { readJson } from "@/lib/fetch-json";

/**
 * Create ads, one screen: photo → ad content → Brand Kit → design.
 * Everything typed here is drawn exactly as written by VentAds' template
 * renderer (no AI writes text into the image). The full 6-step wizard stays
 * available at /new/avanzado.
 */

type Brand = {
  id: string;
  name: string;
  contactPhone: string | null;
  colors: string | null;
  footerNote: string | null;
  logoKey: string | null;
  logoUrl: string | null;
};

type PromotionRow = { value: string; label: string; detail: string; note: string };

const KINDS = [
  { id: "Productos de retail", label: "Producto" },
  { id: "Vehículos", label: "Vehículo" },
  { id: "Servicios", label: "Servicio" },
] as const;

const DESIGNS = [
  { id: "poster-elegante", label: "Póster de marca" },
  { id: "classic", label: "Clásico" },
] as const;

const LOOKS = [
  { id: "COMERCIAL", label: "Claro" },
  { id: "PREMIUM", label: "Oscuro premium" },
] as const;

const COUNTS = [
  { id: "3", label: "3 anuncios" },
  { id: "4", label: "4 anuncios" },
] as const;

const LAST_BRAND_KEY = "ventads:last-brand";
const EMPTY_PROMO: PromotionRow = { value: "", label: "", detail: "", note: "" };

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

/** One item per line; "a, b, c" on one line also works. */
function toLines(text: string) {
  return text
    .split(/\n|,\s+|\s+·\s+|\s+\+\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n");
}

function brandColors(brand: Brand | undefined): [string, string] {
  try {
    const parsed = brand?.colors ? JSON.parse(brand.colors) : [];
    return [parsed[0] ?? "#0b5d2e", parsed[1] ?? "#c9a227"];
  } catch {
    return ["#0b5d2e", "#c9a227"];
  }
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

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export default function CreateAdsPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<UploadedImage[]>([]);
  const [kind, setKind] = useState<string>(KINDS[0].id);
  const [name, setName] = useState("");
  const [kicker, setKicker] = useState("");
  const [bigTitle, setBigTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [price, setPrice] = useState("");
  const [includes, setIncludes] = useState("");
  const [benefits, setBenefits] = useState("");
  const [promos, setPromos] = useState<PromotionRow[]>([]);

  const [design, setDesign] = useState<string>(DESIGNS[0].id);
  const [look, setLook] = useState<string>(LOOKS[0].id);
  const [count, setCount] = useState<string>(COUNTS[0].id);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState<string>("new");
  const [businessName, setBusinessName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [primary, setPrimary] = useState("#0b5d2e");
  const [accent, setAccent] = useState("#c9a227");
  const [logo, setLogo] = useState<UploadedImage[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loadBrand(id: string, list: Brand[]) {
    setBrandId(id);
    const brand = list.find((b) => b.id === id);
    const [p, a] = brandColors(brand);
    setBusinessName(brand?.name ?? "");
    setWhatsapp(brand?.contactPhone ?? "");
    setFooterNote(brand?.footerNote ?? "");
    setPrimary(p);
    setAccent(a);
    setLogo(brand?.logoKey && brand.logoUrl ? [{ key: brand.logoKey, url: brand.logoUrl, width: 0, height: 0 }] : []);
  }

  useEffect(() => {
    fetch("/api/brands")
      .then((res) => readJson<{ brands?: Brand[] }>(res))
      .then((data) => {
        const list = data.brands ?? [];
        setBrands(list);
        const saved = remembered(LAST_BRAND_KEY);
        const preferred = list.find((b) => b.id === saved) ?? list[0];
        if (preferred) loadBrand(preferred.id, list);
      })
      .catch(() => setBrands([]));
  }, []);

  const canGenerate = name.trim() !== "" && !submitting;

  async function saveBrand(): Promise<string | null> {
    const kit = {
      contactPhone: whatsapp.trim() || null,
      footerNote: footerNote.trim() || null,
      colors: [primary, accent],
      logoKey: logo[0]?.key ?? null,
    };
    if (brandId !== "new") {
      const res = await fetch(`/api/brands/${brandId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...kit, ...(businessName.trim() ? { name: businessName.trim() } : {}) }),
      });
      const data = await readJson<{ error?: string }>(res);
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar tu marca.");
      return brandId;
    }
    if (!businessName.trim() && !whatsapp.trim() && logo.length === 0) return null;
    const res = await fetch("/api/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: businessName.trim() || "Mi negocio",
        contactPhone: kit.contactPhone ?? undefined,
        footerNote: kit.footerNote ?? undefined,
        colors: kit.colors,
        logoKey: kit.logoKey ?? undefined,
        defaultCta: whatsapp.trim() ? "Escríbenos por WhatsApp" : undefined,
      }),
    });
    const data = await readJson<{ error?: string; brand: { id: string } }>(res);
    if (!res.ok) throw new Error(data.error ?? "No se pudo guardar tu marca.");
    return data.brand.id;
  }

  async function generate() {
    setSubmitting(true);
    setError(null);
    try {
      const useBrandId = await saveBrand();
      if (useBrandId) remember(LAST_BRAND_KEY, useBrandId);

      const numericPrice = Number(price.replace(/[^\d.]/g, ""));
      const adTitle = [kicker.trim(), bigTitle.trim()].filter(Boolean).join("\n");
      const facts = benefits.trim() ? toLines(benefits) : undefined;
      const promotions = promos
        .filter((p) => p.value.trim() && p.label.trim())
        .map((p) => ({
          value: p.value.trim(),
          label: p.label.trim(),
          detail: p.detail.trim() || null,
          note: p.note.trim() || null,
        }));

      const productRes = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: kind,
          name: name.trim(),
          adTitle: adTitle || undefined,
          description: tagline.trim() || undefined,
          price: price.trim() && numericPrice > 0 ? numericPrice : undefined,
          currency: "USD",
          includes: includes.trim() ? toLines(includes) : undefined,
          benefits: facts,
          features: facts,
          promotions: promotions.length ? promotions : undefined,
          brandId: useBrandId || undefined,
          images: photos.map((img) => ({ ...img, role: "PRODUCT" as const })),
        }),
      });
      const productData = await readJson<{ error?: string; product: { id: string } }>(productRes);
      if (!productRes.ok) throw new Error(productData.error ?? "No se pudo guardar el producto.");

      const campaignRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: productData.product.id,
          objective: "VENDER",
          style: look,
          variants: Number(count),
          templateId: design === "classic" ? undefined : design,
        }),
      });
      const campaignData = await readJson<{ error?: string; campaign: { id: string } }>(campaignRes);
      if (!campaignRes.ok) throw new Error(campaignData.error ?? "No se pudieron generar los anuncios.");

      router.push(`/results/${campaignData.campaign.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocurrió un error inesperado.");
      setSubmitting(false);
    }
  }

  function setPromo(index: number, patch: Partial<PromotionRow>) {
    setPromos((list) => list.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          ventADS<span className="text-accent-strong">.ai</span>
        </Link>
        <Link href="/products" className="text-sm text-muted hover:text-foreground">
          Mis productos
        </Link>
      </header>

      <div>
        <h1 className="text-2xl font-semibold text-foreground">Crear anuncios</h1>
        <p className="mt-1 text-sm text-muted">
          Tu foto real + tu marca + tus datos exactos. VentAds arma el diseño en 1080×1080, 1080×1350 y 1080×1920.
        </p>
      </div>

      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (canGenerate) void generate();
        }}
      >
        <Section title="1. Foto" hint="Tu foto original se conserva siempre. Mejor si el producto se ve completo.">
          <ImageUploader images={photos} onChange={setPhotos} folder="products" label="Foto del producto" />
          <Chips options={KINDS} value={kind} onChange={setKind} />
        </Section>

        <Section title="2. Anuncio" hint="Solo datos reales: se imprimen tal cual los escribes.">
          <Field label="¿Qué vendes?" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juego de sala Imperial" autoFocus />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Línea pequeña del título" hint="Opcional">
              <Input value={kicker} onChange={(e) => setKicker(e.target.value)} placeholder="Ej: Juego de sala" />
            </Field>
            <Field label="Título grande" hint="Opcional; si lo dejas vacío usamos el nombre">
              <Input value={bigTitle} onChange={(e) => setBigTitle(e.target.value)} placeholder="Ej: Imperial" />
            </Field>
          </div>
          <Field label="Frase corta" hint="Opcional">
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ej: Elegancia, comodidad y estilo para transformar tu sala." />
          </Field>
          <Field label="Precio (USD)" hint="Opcional">
            <Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ej: 1299" />
          </Field>
          <Field label="¿Qué incluye?" hint="Opcional. Separado por comas: se muestra con íconos.">
            <Textarea value={includes} onChange={(e) => setIncludes(e.target.value)} placeholder="Sofá triple, Sofá doble, 2 poltronas, Mesa de centro" className="min-h-16" />
          </Field>
          <Field label="Beneficios / características" hint="Opcional. Hasta 4 se muestran con íconos.">
            <Textarea
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="Estructura de madera de alta calidad, Tapizado antifluido fácil de limpiar, Durabilidad y confort"
              className="min-h-16"
            />
          </Field>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Promociones</span>
            {promos.map((p, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-[var(--radius-sm)] border border-border p-3 sm:grid-cols-4">
                <Input value={p.value} onChange={(e) => setPromo(i, { value: e.target.value })} placeholder="15%" aria-label="Valor" />
                <Input value={p.label} onChange={(e) => setPromo(i, { label: e.target.value })} placeholder="de descuento" aria-label="Texto" />
                <Input value={p.detail} onChange={(e) => setPromo(i, { detail: e.target.value })} placeholder="En toda la tienda" aria-label="Detalle" />
                <div className="flex gap-2">
                  <Input value={p.note} onChange={(e) => setPromo(i, { note: e.target.value })} placeholder="(Pago en efectivo)" aria-label="Nota" />
                  <button
                    type="button"
                    onClick={() => setPromos((list) => list.filter((_, j) => j !== i))}
                    className="px-2 text-muted hover:text-danger cursor-pointer"
                    aria-label="Quitar promoción"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            {promos.length < 3 && (
              <button
                type="button"
                onClick={() => setPromos((list) => [...list, { ...EMPTY_PROMO }])}
                className="self-start text-sm text-accent-strong underline cursor-pointer"
              >
                + Agregar promoción
              </button>
            )}
          </div>
        </Section>

        <Section title="3. Tu marca (Brand Kit)" hint="Se guarda y se usa en todos tus anuncios.">
          {brands.length > 0 && (
            <select
              value={brandId}
              onChange={(e) => (e.target.value === "new" ? loadBrand("new", []) : loadBrand(e.target.value, brands))}
              className="w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
              <option value="new">+ Otra marca…</option>
            </select>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Nombre del negocio" />
            <Input inputMode="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp, ej: 099 336 1284" />
          </div>
          <Input value={footerNote} onChange={(e) => setFooterNote(e.target.value)} placeholder="Pie del anuncio (opcional), ej: Envío a todo el país" />
          <div className="flex flex-wrap items-end gap-5">
            <ImageUploader images={logo} onChange={setLogo} folder="logos" multiple={false} label="Logo" aspectClassName="aspect-[4/3]" />
            <label className="flex flex-col gap-1 text-sm text-foreground">
              Color principal
              <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-10 w-20 cursor-pointer rounded border border-border" />
            </label>
            <label className="flex flex-col gap-1 text-sm text-foreground">
              Color de acento
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-10 w-20 cursor-pointer rounded border border-border" />
            </label>
          </div>
        </Section>

        <Section title="4. Diseño">
          <Chips options={DESIGNS} value={design} onChange={setDesign} />
          {design === "classic" && <Chips options={LOOKS} value={look} onChange={setLook} />}
          <Chips options={COUNTS} value={count} onChange={setCount} />
        </Section>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" size="lg" disabled={!canGenerate}>
          {submitting ? "Creando tus anuncios…" : `Crear ${count} anuncios × 3 tamaños`}
        </Button>
      </form>

      <p className="text-center text-xs text-muted">
        ¿Necesitas objetivo o público?{" "}
        <Link href="/new/avanzado" className="underline hover:text-foreground">
          Modo avanzado
        </Link>
      </p>
    </div>
  );
}
