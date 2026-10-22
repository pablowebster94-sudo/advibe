"use client";

import { useState } from "react";

type Formato = "1:1" | "4:5" | "9:16";
type Motor = "openai" | "google";

const FORMATOS: Array<{ id: Formato; nombre: string; ancho: number; alto: number }> = [
  { id: "1:1", nombre: "Cuadrado 1:1", ancho: 1080, alto: 1080 },
  { id: "4:5", nombre: "Feed 4:5", ancho: 1080, alto: 1350 },
  { id: "9:16", nombre: "Historia 9:16", ancho: 1080, alto: 1920 },
];

// Recorta al centro y escala a la medida exacta de Meta (1080 px de ancho).
async function recortar(src: string, formato: Formato) {
  const f = FORMATOS.find((x) => x.id === formato)!;
  const img = new Image();
  img.src = src;
  await img.decode();
  const objetivo = f.ancho / f.alto;
  let sw = img.width, sh = img.height;
  if (sw / sh > objetivo) sw = sh * objetivo; else sh = sw / objetivo;
  const canvas = document.createElement("canvas");
  canvas.width = f.ancho;
  canvas.height = f.alto;
  canvas.getContext("2d")!.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, f.ancho, f.alto);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function exportar(src: string, formato: Formato) {
  const a = document.createElement("a");
  a.href = await recortar(src, formato);
  a.download = `advibe-${formato.replace(":", "x")}-${Date.now()}.jpg`;
  a.click();
}

type Cuenta = { _id: string; platform: string; username?: string; displayName?: string };

export default function ImagenesPage() {
  const [clave, setClave] = useState("");
  const [prompt, setPrompt] = useState("");
  const [formato, setFormato] = useState<Formato>("4:5");
  const [motor, setMotor] = useState<Motor>("openai");
  const [calidad, setCalidad] = useState("medium");
  const [cantidad, setCantidad] = useState(2);
  const [referencia, setReferencia] = useState<File | null>(null);
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuentas, setCuentas] = useState<Cuenta[] | null>(null);
  const [elegidas, setElegidas] = useState<string[]>([]);
  const [texto, setTexto] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);

  async function cargarCuentas() {
    setAviso(null);
    const res = await fetch("/api/zernio", { headers: { "x-clave": clave } });
    const data = await res.json();
    if (!res.ok) return setAviso(data.error || "Error con Zernio.");
    setCuentas(data.cuentas);
    if (!data.cuentas.length) setAviso("Zernio no tiene cuentas conectadas. Conéctalas en zernio.com.");
  }

  async function enviarAZernio(src: string, f: Formato) {
    if (!elegidas.length) return setAviso("Elige al menos una cuenta de Zernio.");
    setAviso("Enviando borrador a Zernio…");
    const res = await fetch("/api/zernio", {
      method: "POST",
      headers: { "x-clave": clave, "Content-Type": "application/json" },
      body: JSON.stringify({ imagen: await recortar(src, f), texto, cuentaIds: elegidas }),
    });
    const data = await res.json();
    setAviso(res.ok ? `Borrador creado en Zernio (${data.postId}). Revísalo y prográmalo allí o pídeselo a Claude.` : data.error || "Error con Zernio.");
  }

  async function generar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError(null);
    const form = new FormData();
    form.append("prompt", prompt);
    form.append("formato", formato);
    form.append("motor", motor);
    form.append("calidad", calidad);
    form.append("cantidad", String(cantidad));
    if (referencia) form.append("referencia", referencia);
    try {
      const res = await fetch("/api/imagenes", { method: "POST", headers: { "x-clave": clave }, body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar.");
      setImagenes((prev) => [...data.imagenes, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar.");
    } finally {
      setCargando(false);
    }
  }

  const campo = "w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-100";

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">AdVibe Imágenes</h1>
        <p className="mt-1 text-sm text-neutral-400">Genera, descarga y súbela a Meta Ads.</p>

        <form onSubmit={generar} className="mt-6 space-y-4">
          <textarea className={`${campo} min-h-28`} placeholder="Ej.: SUV blanca en carretera de montaña al atardecer, estilo anuncio, espacio libre arriba para texto" value={prompt} onChange={(e) => setPrompt(e.target.value)} required />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-sm">Formato
              <select className={campo} value={formato} onChange={(e) => setFormato(e.target.value as Formato)}>
                {FORMATOS.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </label>
            <label className="text-sm">Motor
              <select className={campo} value={motor} onChange={(e) => setMotor(e.target.value as Motor)}>
                <option value="openai">OpenAI (texto en español)</option>
                <option value="google">Google (editar fotos)</option>
              </select>
            </label>
            <label className="text-sm">Calidad
              <select className={campo} value={calidad} onChange={(e) => setCalidad(e.target.value)} disabled={motor !== "openai"}>
                <option value="low">Borrador</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </label>
            <label className="text-sm">Opciones
              <select className={campo} value={cantidad} onChange={(e) => setCantidad(Number(e.target.value))}>
                {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>

          <label className="block text-sm">Foto de referencia (opcional: auto real, producto, logo)
            <input type="file" accept="image/png,image/jpeg,image/webp" className={campo} onChange={(e) => setReferencia(e.target.files?.[0] ?? null)} />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input type="password" className={campo} placeholder="Clave de acceso" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
            <button type="submit" disabled={cargando} className="rounded-lg bg-white px-6 py-2 font-semibold text-black disabled:opacity-50">
              {cargando ? "Generando…" : "Generar"}
            </button>
          </div>
          {error && <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-200">{error}</p>}
        </form>

        <section className="mt-6 space-y-3 rounded-xl border border-neutral-800 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Zernio (borradores)</h2>
            <button type="button" onClick={cargarCuentas} disabled={!clave} className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-neutral-800 disabled:opacity-50">
              {cuentas ? "Recargar cuentas" : "Cargar cuentas"}
            </button>
          </div>
          {cuentas && cuentas.length > 0 && (
            <div className="flex flex-wrap gap-3 text-sm">
              {cuentas.map((c) => (
                <label key={c._id} className="flex items-center gap-2">
                  <input type="checkbox" checked={elegidas.includes(c._id)} onChange={(e) => setElegidas((prev) => e.target.checked ? [...prev, c._id] : prev.filter((id) => id !== c._id))} />
                  {c.platform} · {c.username || c.displayName || c._id}
                </label>
              ))}
            </div>
          )}
          <textarea className={`${campo} min-h-20`} placeholder="Texto de la publicación (caption)" value={texto} onChange={(e) => setTexto(e.target.value)} />
          <p className="text-xs text-neutral-500">Solo crea borradores. Programar o publicar se confirma aparte.</p>
          {aviso && <p className="rounded-lg bg-neutral-900 px-3 py-2 text-sm text-neutral-200">{aviso}</p>}
        </section>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {imagenes.map((src, i) => (
            <div key={i} className="rounded-xl border border-neutral-800 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Imagen generada ${i + 1}`} className="w-full rounded-lg" />
              <div className="mt-2 flex flex-wrap gap-2">
                {FORMATOS.map((f) => (
                  <button key={f.id} type="button" onClick={() => exportar(src, f.id)} className="rounded-md border border-neutral-700 px-3 py-1 text-xs hover:bg-neutral-800">
                    Descargar {f.id}
                  </button>
                ))}
                {cuentas && cuentas.length > 0 && FORMATOS.map((f) => (
                  <button key={`z-${f.id}`} type="button" onClick={() => enviarAZernio(src, f.id)} className="rounded-md border border-emerald-800 px-3 py-1 text-xs text-emerald-300 hover:bg-emerald-950">
                    Zernio {f.id}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
