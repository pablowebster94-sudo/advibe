"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ImageUploader, type UploadedImage } from "@/components/wizard/ImageUploader";
import { Button } from "@/components/ui/Button";
import { readJson } from "@/lib/fetch-json";

const FORMATS = [
  { id: "SQUARE_1_1", label: "Cuadrado", size: "1080 × 1080", ratio: "1:1" },
  { id: "PORTRAIT_4_5", label: "Feed vertical", size: "1080 × 1350", ratio: "4:5" },
  { id: "STORY_9_16", label: "Historia / Reel", size: "1080 × 1920", ratio: "9:16" },
] as const;

const STYLES = [
  ["AUTO", "Que la IA decida"],
  ["PREMIUM", "Premium"],
  ["COMERCIAL", "Comercial"],
  ["MINIMALISTA", "Minimalista"],
  ["ELEGANTE", "Elegante"],
  ["MODERNO", "Moderno"],
  ["LIFESTYLE", "Lifestyle"],
  ["URGENCIA", "Promoción"],
  ["DEPORTIVO", "Deportivo"],
] as const;

type Brand = {
  id: string;
  name: string;
  contactPhone: string | null;
  colors: string | null;
  footerNote: string | null;
  logoKey: string | null;
  logoUrl: string | null;
};

const ALL_FORMAT_IDS = FORMATS.map((format) => format.id);

export default function CreateAdsPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [productImage, setProductImage] = useState<UploadedImage[]>([]);
  const [logoImage, setLogoImage] = useState<UploadedImage[]>([]);
  const [formats, setFormats] = useState<string[]>(ALL_FORMAT_IDS);
  const [style, setStyle] = useState<string>("AUTO");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandId, setBrandId] = useState("new");
  const [brandName, setBrandName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [footerNote, setFooterNote] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#111827");
  const [accentColor, setAccentColor] = useState("#f4a900");
  const [showBrand, setShowBrand] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/brands", { cache: "no-store" })
      .then((response) => readJson<{ brands?: Brand[] }>(response))
      .then((data) => { if (active) setBrands(data.brands ?? []); })
      .catch(() => { if (active) setBrands([]); });
    return () => { active = false; };
  }, []);

  const canGenerate = useMemo(() => prompt.trim().length >= 8 && formats.length > 0 && !submitting, [prompt, formats, submitting]);

  function selectBrand(value: string) {
    setBrandId(value);
    const brand = brands.find((item) => item.id === value);
    if (!brand) {
      setBrandName(""); setContactPhone(""); setFooterNote("");
      setLogoImage([]); setPrimaryColor("#111827"); setAccentColor("#f4a900");
      return;
    }
    setBrandName(brand.name);
    setContactPhone(brand.contactPhone ?? "");
    setFooterNote(brand.footerNote ?? "");
    try {
      const colors = brand.colors ? JSON.parse(brand.colors) as string[] : [];
      setPrimaryColor(colors[0] ?? "#111827");
      setAccentColor(colors[1] ?? "#f4a900");
    } catch {
      setPrimaryColor("#111827"); setAccentColor("#f4a900");
    }
    // The server reads an existing Brand Kit logo by key; only upload a new
    // logo here when the user explicitly replaces it.
    setLogoImage([]);
  }

  async function generate() {
    if (!canGenerate) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/creative-studio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          productImage: productImage[0] ? { key: productImage[0].key, width: productImage[0].width, height: productImage[0].height } : undefined,
          logoImage: logoImage[0] ? { key: logoImage[0].key, width: logoImage[0].width, height: logoImage[0].height } : undefined,
          brandId: brandId !== "new" ? brandId : undefined,
          brandName: brandName.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          footerNote: footerNote.trim() || undefined,
          colors: [primaryColor, accentColor],
          style,
          formats,
        }),
      });
      const data = await readJson<{ error?: string; campaign?: { id: string } }>(response);
      if (!response.ok || !data.campaign?.id) throw new Error(data.error ?? "No se pudo iniciar la generación.");
      router.push(`/results/${data.campaign.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ocurrió un error inesperado.");
      setSubmitting(false);
    }
  }

  function toggleFormat(id: string) {
    setFormats((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
            AD VIBE <span className="text-accent-strong">AI</span>
          </Link>
          <Link href="/products" className="text-sm text-muted transition hover:text-foreground">Mis creaciones</Link>
        </header>

        <section className="space-y-3 pt-3 sm:pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent-strong">AI Advertising Creative Studio</p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Tu idea. Nuestra dirección creativa. <span className="text-muted">Un anuncio listo para publicar.</span>
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Cuéntame qué necesitas como se lo explicarías a un diseñador. La IA desarrolla el concepto, el copy y la composición.
          </p>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-[0_24px_80px_rgba(0,0,0,0.12)] sm:p-6">
          <label htmlFor="creative-prompt" className="mb-3 block text-sm font-semibold">¿Qué publicidad quieres crear?</label>
          <textarea
            id="creative-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ejemplo: Crea un flyer premium para promocionar un juego de sala moderno. Quiero que transmita elegancia y comodidad. Incluye un llamado a escribir por WhatsApp. No inventes precios ni características."
            rows={5}
            maxLength={5000}
            className="min-h-36 w-full resize-y rounded-xl border border-border bg-background px-4 py-4 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent-strong focus:ring-2 focus:ring-accent-strong/15"
          />
          <div className="mt-2 flex justify-between text-[11px] text-muted">
            <span>Escribe con libertad. No necesitas completar formularios.</span>
            <span>{prompt.length}/5000</span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-semibold">Fotografía del producto <span className="font-normal text-muted">(opcional)</span></p>
              <p className="text-xs text-muted">Usaremos tu fotografía original y la integraremos sin redibujar el producto.</p>
              <ImageUploader images={productImage} onChange={setProductImage} folder="products" multiple={false} label="Subir producto" aspectClassName="aspect-[4/3]" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Logotipo <span className="font-normal text-muted">(opcional)</span></p>
              <p className="text-xs text-muted">Se añade como una capa independiente para conservarlo intacto.</p>
              <ImageUploader images={logoImage} onChange={setLogoImage} folder="logos" multiple={false} label="Subir logo" aspectClassName="aspect-[4/3]" />
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">Formatos de publicación</p>
              <button type="button" onClick={() => setFormats(ALL_FORMAT_IDS)} className="text-xs text-accent-strong hover:underline">Usar los 3 formatos</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {FORMATS.map((format) => {
                const selected = formats.includes(format.id);
                return (
                  <button key={format.id} type="button" aria-pressed={selected} onClick={() => toggleFormat(format.id)}
                    className={`rounded-xl border p-3 text-left transition ${selected ? "border-accent-strong bg-accent-soft/40" : "border-border bg-background hover:border-muted"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{format.label}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${selected ? "border-accent-strong bg-accent-strong text-white" : "border-border text-transparent"}`}>✓</span>
                    </div>
                    <p className="mt-1 text-xs text-muted">{format.size} · {format.ratio}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr]">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold">Dirección artística</span>
              <select value={style} onChange={(event) => setStyle(event.target.value)} className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-accent-strong">
                {STYLES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <div className="flex flex-col justify-end text-xs leading-5 text-muted">
              <span>La opción automática interpreta tu idea y selecciona el estilo visual más adecuado.</span>
              <span>Se generan 3 propuestas creativas con enfoques distintos.</span>
            </div>
          </div>

          <details open={showBrand} onToggle={(event) => setShowBrand((event.currentTarget as HTMLDetailsElement).open)} className="mt-6 rounded-xl border border-border bg-background px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold">Identidad de marca <span className="font-normal text-muted">(opcional)</span></summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {brands.length > 0 && (
                <label className="flex flex-col gap-1.5 text-xs text-muted sm:col-span-2">
                  Seleccionar marca guardada
                  <select value={brandId} onChange={(event) => selectBrand(event.target.value)} className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground">
                    <option value="new">Crear / usar otra marca</option>
                    {brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1.5 text-xs text-muted">
                Nombre del negocio
                <input value={brandName} onChange={(event) => setBrandName(event.target.value)} placeholder="Ej. Muebles Ideal" className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent-strong" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-muted">
                WhatsApp de contacto
                <input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="Ej. 099 000 0000" className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent-strong" />
              </label>
              <label className="flex flex-col gap-1.5 text-xs text-muted">
                Texto de pie
                <input value={footerNote} onChange={(event) => setFooterNote(event.target.value)} placeholder="Ej. Envíos a todo el Ecuador" className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-accent-strong" />
              </label>
              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-xs text-muted">Principal <input aria-label="Color principal" type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" /></label>
                <label className="flex items-center gap-2 text-xs text-muted">Acento <input aria-label="Color de acento" type="color" value={accentColor} onChange={(event) => setAccentColor(event.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" /></label>
              </div>
            </div>
          </details>

          {error && <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted">Tus datos comerciales se componen como texto real. La IA no debe inventar precios ni beneficios.</p>
            <Button type="button" size="lg" disabled={!canGenerate} onClick={() => void generate()}>
              {submitting ? "Preparando tus propuestas…" : "Generar publicidad →"}
            </Button>
          </div>
        </section>

        <p className="text-center text-xs text-muted">¿Necesitas más controles? <Link href="/new/avanzado" className="underline hover:text-foreground">Abrir modo avanzado</Link></p>
      </div>
    </main>
  );
}
