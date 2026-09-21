"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { sendCapiEvent, trackEvent, trackMetaEvent } from "@/lib/tracking";

const whatsappNumber = "593984966335";
const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;

function getFbc() {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|; )_fbc=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export default function DiagnosticPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const bookingUrl = useMemo(() => {
    if (!calendlyUrl) return "";
    const separator = calendlyUrl.includes("?") ? "&" : "?";
    return `${calendlyUrl}${separator}hide_gdpr_banner=1`;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const data = {
      name: String(form.get("name") || "").trim(),
      company: String(form.get("company") || "").trim(),
      website: String(form.get("website") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      email: String(form.get("email") || "").trim(),
      service: String(form.get("service") || "").trim(),
      budget: String(form.get("budget") || "").trim(),
    };

    const eventId = crypto.randomUUID();
    trackEvent("diagnostic_form_submit", { source: "diagnostic_landing", service: data.service, budget: data.budget });
    trackMetaEvent("Lead", { content_name: "Diagnóstico digital AdVibe", content_category: "lead_generation" }, eventId);
    const testEventCode = new URLSearchParams(window.location.search).get("test_event_code") || undefined;
    await sendCapiEvent({ eventName: "Lead", eventId, email: data.email, phone: data.phone, testEventCode });

    const message = [
      "Hola AdVibe, quiero solicitar un diagnóstico estratégico.",
      "",
      `Nombre: ${data.name}`,
      `Empresa: ${data.company}`,
      `Web: ${data.website || "No indicada"}`,
      `WhatsApp: ${data.phone}`,
      `Email: ${data.email}`,
      `Necesidad: ${data.service}`,
      `Presupuesto: ${data.budget}`,
      `FBC: ${getFbc() || "No disponible"}`,
    ].join("\n");

    setSubmitted(true);
    if (bookingUrl) {
      const params = new URLSearchParams({
        name: data.name,
        email: data.email,
        a1: data.phone,
      });
      window.location.href = `${bookingUrl}${bookingUrl.includes("?") ? "&" : "?"}${params.toString()}`;
    } else {
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-semibold tracking-tight">AdVibe<span className="text-lime-300">.</span></Link>
          <span className="text-xs uppercase tracking-[0.25em] text-slate-500">Diagnóstico estratégico</span>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(163,230,53,0.12),transparent_28%),radial-gradient(circle_at_10%_70%,rgba(34,211,238,0.08),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">Diagnóstico digital gratuito</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.055em] sm:text-7xl">
              ¿Tu marketing está generando clientes o solamente actividad?
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              Analizamos tu presencia digital, captación, conversión y seguimiento para detectar oportunidades concretas de mejora.
            </p>
            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
              {["Publicidad y adquisición", "Web y conversión", "Contenido y posicionamiento", "WhatsApp, CRM y seguimiento"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200">
                  <span className="mr-2 text-lime-300">✓</span>{item}
                </div>
              ))}
            </div>
            <p className="mt-8 text-sm text-slate-500">AdVibe conecta creatividad, performance y tecnología para empresas en Ecuador y EE. UU.</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-300">1 · Cuéntanos de tu negocio</p>
              <h2 className="mt-3 text-2xl font-semibold">Solicita tu diagnóstico</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Toma menos de 2 minutos. Usaremos la información para preparar una conversación útil.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input required name="name" autoComplete="name" placeholder="Nombre completo" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
              <input required name="company" autoComplete="organization" placeholder="Empresa" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
              <input name="website" type="url" placeholder="Sitio web (opcional)" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
              <div className="grid gap-4 sm:grid-cols-2">
                <input required name="phone" autoComplete="tel" placeholder="WhatsApp / teléfono" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
                <input required name="email" type="email" autoComplete="email" placeholder="Correo" className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
              </div>
              <select required name="service" defaultValue="" className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3.5 text-white outline-none focus:border-lime-300/60">
                <option value="" disabled>¿Qué necesitas mejorar?</option>
                <option>Publicidad / Meta Ads</option>
                <option>Contenido audiovisual</option>
                <option>Web / Landing Page</option>
                <option>IA / Automatización / CRM</option>
                <option>Estrategia integral</option>
              </select>
              <select required name="budget" defaultValue="" className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3.5 text-white outline-none focus:border-lime-300/60">
                <option value="" disabled>Inversión mensual aproximada</option>
                <option>Menos de $300</option>
                <option>$300 – $1.000</option>
                <option>$1.000 – $3.000</option>
                <option>Más de $3.000</option>
                <option>Aún no lo sé</option>
              </select>

              <label className="flex items-start gap-3 text-xs leading-5 text-slate-500">
                <input required type="checkbox" className="mt-1 accent-lime-300" />
                <span>Acepto que AdVibe use estos datos para contactarme sobre el diagnóstico solicitado.</span>
              </label>

              <button disabled={loading} className="w-full rounded-xl bg-lime-300 px-5 py-4 font-semibold text-slate-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60">
                {loading ? "Preparando tu diagnóstico…" : submitted ? "Continuar" : "Solicitar diagnóstico gratuito ↗"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080808] py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-3">
          {[
            ["01", "Diagnóstico", "Entendemos tu situación y detectamos oportunidades."],
            ["02", "Sesión", "Revisamos prioridades y próximos pasos contigo."],
            ["03", "Sistema", "Si hay encaje, diseñamos la solución adecuada."],
          ].map(([number, title, text]) => (
            <div key={number} className="border-t border-white/10 pt-5">
              <span className="font-mono text-xs text-lime-300">{number}</span>
              <h3 className="mt-3 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
