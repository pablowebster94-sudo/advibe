"use client";

import { useMemo, useState } from "react";

const brands = {
  muebles: {
    name: "Muebles Ideal",
    industry: "Diseño / Retail",
    tone: "Premium, moderno, cercano",
    palette: "Tonos cálidos, madera natural, neutros sofisticados",
    style: "Fotografía editorial de interiores, luz suave, producto protagonista",
    restriction: "Evitar fondos planos y estética genérica de catálogo",
  },
  gastro: {
    name: "Gastro Fest",
    industry: "Eventos / Gastronomía",
    tone: "Enérgico, juvenil, festivo",
    palette: "Naranja, azul noche, acentos neón",
    style: "Fotografía de festival, alto contraste, ambiente nocturno",
    restriction: "Evitar luz diurna y fondos minimalistas blancos",
  },
  luxe: {
    name: "Inmobiliaria Luxe",
    industry: "Bienes raíces",
    tone: "Elegante, aspiracional, confiable",
    palette: "Negro, champagne, beige, verdes discretos",
    style: "Arquitectura premium, cinematográfica, perspectiva limpia",
    restriction: "Evitar saturación excesiva y clichés inmobiliarios",
  },
};

type Format = "1:1" | "9:16" | "16:9";

export default function VisualFlowPage() {
  const [brandKey, setBrandKey] = useState<keyof typeof brands>("muebles");
  const [request, setRequest] = useState(
    "Hazme una publicidad para promocionar un sofá moderno y elegante."
  );
  const [format, setFormat] = useState<Format>("1:1");
  const [running, setRunning] = useState(false);
  const [headline, setHeadline] = useState("Diseño que transforma tu espacio");
  const [cta, setCta] = useState("Descubre la colección");
  const [activeTab, setActiveTab] = useState<"brief" | "prompt" | "qc">("brief");
  const [generated, setGenerated] = useState(false);

  const brand = brands[brandKey];

  const brief = useMemo(() => ({
    cliente: brand.name,
    objetivo: "conversión",
    tono: brand.tone,
    publico: "Personas interesadas en productos premium y diseño",
    industria: brand.industry,
    mensaje_clave: headline,
    cta,
    paleta_color: brand.palette,
    formato: `feed ${format}`,
  }), [brand, headline, cta, format]);

  const prompt = useMemo(() =>
    `Commercial advertising photography, premium ${brand.industry.toLowerCase()} campaign, main subject based on this request: ${request}. ${brand.style}. Sophisticated composition, realistic materials, controlled depth of field, cinematic lighting, ${brand.palette}. Clean visual hierarchy with negative space for text overlay. No logos, no typography inside the image. Aspect ratio ${format}.`,
    [brand, request, format]
  );

  const runPipeline = async () => {
    setRunning(true);
    setGenerated(false);
    for (let i = 0; i < 4; i++) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    setGenerated(true);
    setRunning(false);
  };

  const presets = [
    ["Muebles", "muebles" as const, "Hazme una publicidad para promocionar un comedor moderno y elegante."],
    ["Gastro", "gastro" as const, "Crea un flyer para promocionar una noche de música en vivo."],
    ["Inmobiliaria", "luxe" as const, "Crea una pieza para vender un departamento premium con vista panorámica."],
  ];

  return (
    <main className="min-h-screen bg-[#070707] text-white">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-400">AdVibe Agencia</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Visual Flow</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">De una idea escrita en lenguaje natural a una pieza publicitaria lista para producir.</p>
          </div>
          <a href="/" className="text-sm text-white/60 hover:text-white">← Volver a AdVibe</a>
        </header>

        <section className="grid gap-6 lg:grid-cols-[430px_1fr]">
          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/30">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-semibold">1. Tu pedido</h2>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] text-emerald-300">Motor listo</span>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {presets.map(([label, key, value]) => (
                  <button key={label} onClick={() => { setBrandKey(key); setRequest(value); }} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 hover:border-indigo-400/40 hover:text-white">
                    {label}
                  </button>
                ))}
              </div>

              <label className="mb-2 block text-xs font-medium text-white/50">Cliente</label>
              <select value={brandKey} onChange={(e) => setBrandKey(e.target.value as keyof typeof brands)} className="mb-4 w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-indigo-400/60">
                <option value="muebles">Muebles Ideal</option>
                <option value="gastro">Gastro Fest</option>
                <option value="luxe">Inmobiliaria Luxe</option>
              </select>

              <div className="mb-4 rounded-2xl border border-indigo-400/10 bg-indigo-400/5 p-3 text-xs text-white/65">
                <div className="mb-1 flex justify-between"><strong className="text-white">{brand.name}</strong><span className="text-indigo-300">Brand Brain activo</span></div>
                <p><span className="text-white/40">Estilo:</span> {brand.style}</p>
                <p className="mt-1"><span className="text-white/40">Restricción:</span> {brand.restriction}</p>
              </div>

              <label className="mb-2 block text-xs font-medium text-white/50">¿Qué quieres crear?</label>
              <textarea value={request} onChange={(e) => setRequest(e.target.value)} rows={5} className="w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-indigo-400/60" />

              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium text-white/50">Formato</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["1:1", "9:16", "16:9"] as Format[]).map((item) => (
                    <button key={item} onClick={() => setFormat(item)} className={`rounded-2xl border px-3 py-3 text-xs font-semibold transition ${format === item ? "border-indigo-400/70 bg-indigo-400/15 text-white" : "border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={runPipeline} disabled={running} className="mt-5 w-full rounded-2xl bg-indigo-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
                {running ? "Procesando flujo…" : "✨ Generar pieza"}
              </button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Pipeline</h3>
              <div className="space-y-3">
                {["Intérprete · Brief JSON", "Director de Arte · Prompt técnico", "Estudio · Generación", "Control de Calidad · Ensamblaje"].map((step, i) => (
                  <div key={step} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 p-3 text-sm">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${generated || (running && i === 0) ? "bg-indigo-500 text-white" : "bg-white/10 text-white/50"}`}>{i + 1}</span>
                    <span className="text-white/70">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Studio</p>
                  <h2 className="mt-1 text-xl font-semibold">Pieza final</h2>
                </div>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] text-white/45">{format}</span>
              </div>

              <div className={`relative mx-auto overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.35),transparent_28%),linear-gradient(135deg,#171717,#050505)] shadow-2xl ${format === "9:16" ? "aspect-[9/16] max-w-sm" : format === "16:9" ? "aspect-video" : "aspect-square max-w-2xl"}`}>
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,.76),rgba(0,0,0,.12)_55%,rgba(255,255,255,.03))]" />
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/65">{brand.name}</span>
                  <h3 className="mt-3 max-w-xl text-3xl font-bold leading-tight md:text-5xl">{headline}</h3>
                  <button className="mt-5 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-black">{cta}</button>
                </div>
                {!generated && !running && <div className="absolute inset-0 flex items-center justify-center text-center"><div><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl">✦</div><p className="text-sm text-white/50">Ejecuta el flujo para visualizar tu concepto.</p></div></div>}
                {running && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"><div className="text-center"><div className="mx-auto mb-3 h-9 w-9 animate-spin rounded-full border-2 border-white/15 border-t-indigo-400" /><p className="text-sm text-white/65">Construyendo dirección de arte…</p></div></div>}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs text-white/45">Headline</label>
                  <input value={headline} onChange={(e) => setHeadline(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-indigo-400/60" />
                </div>
                <div>
                  <label className="mb-2 block text-xs text-white/45">CTA</label>
                  <input value={cta} onChange={(e) => setCta(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-indigo-400/60" />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex gap-2 border-b border-white/10 pb-3">
                {[['brief','Brief JSON'],['prompt','Prompt técnico'],['qc','Calidad']].map(([id,label]) => (
                  <button key={id} onClick={() => setActiveTab(id as typeof activeTab)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${activeTab === id ? "bg-indigo-500/15 text-indigo-300" : "text-white/40 hover:text-white"}`}>{label}</button>
                ))}
              </div>
              {activeTab === "brief" && <pre className="mt-4 overflow-auto rounded-2xl bg-black/30 p-4 text-xs leading-6 text-indigo-200">{JSON.stringify(brief, null, 2)}</pre>}
              {activeTab === "prompt" && <div className="mt-4 rounded-2xl bg-black/30 p-4 text-xs leading-6 text-emerald-300">{prompt}</div>}
              {activeTab === "qc" && <div className="mt-4 grid gap-2 sm:grid-cols-2">{["Brand Brain aplicado","Formato correcto","Jerarquía visual","Texto separado de imagen"].map((item) => <div key={item} className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-3 text-xs text-emerald-300">✓ {item}</div>)}</div>}
            </div>
          </div>
        </section>

        <footer className="mt-10 border-t border-white/10 pt-5 text-xs text-white/35">MVP frontend funcional · La conexión real con OpenAI/Supabase/Bannerbear queda preparada para la siguiente fase.</footer>
      </div>
    </main>
  );
}
