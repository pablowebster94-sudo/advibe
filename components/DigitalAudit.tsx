"use client";

import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/tracking";

const whatsappNumber = "593984966335";

export default function DigitalAudit() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const company = String(form.get("company") || "").trim();
    const website = String(form.get("website") || "").trim();

    const message = [
      "Hola AdVibe, quiero solicitar un diagnóstico de mi presencia digital.",
      "",
      `Nombre: ${name}`,
      `Empresa: ${company}`,
      `Sitio web: ${website || "No tengo sitio web todavía"}`,
    ].join("\n");

    setSubmitted(true);
    trackEvent("digital_audit_submitted", { has_website: Boolean(website) });
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section id="diagnostico" className="relative scroll-mt-24 overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.08),transparent_35%)]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Primer paso · sin compromiso</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">Antes de venderte un servicio, encontremos la oportunidad.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-300">En pocos minutos identificamos dónde puede estar el mayor cuello de botella de tu presencia digital, captación o conversión.</p>
        </div>

        <div className="grid gap-10 overflow-hidden rounded-[2.5rem] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(8,8,8,0.94))] p-8 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
          <div className="max-w-2xl">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["01", "Presencia", "Marca, web y puntos de contacto"],
                ["02", "Captación", "Anuncios, contenido y demanda"],
                ["03", "Conversión", "Seguimiento, WhatsApp y procesos"],
              ].map(([number, title, description]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="text-xs font-semibold text-cyan-300">{number}</span>
                  <p className="mt-3 font-semibold text-white">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-5">
              <p className="text-sm font-semibold text-white">¿Qué recibes?</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-300">
                <li>✓ Una lectura clara de tus principales oportunidades.</li>
                <li>✓ Prioridades concretas antes de invertir más.</li>
                <li>✓ Una recomendación de siguiente paso, solo si tiene sentido.</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-black/40 p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Solicita tu diagnóstico</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">Completa lo esencial. Te llevaremos a WhatsApp para continuar.</p>
            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Tu nombre</span>
                <input required name="name" autoComplete="name" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60" placeholder="Ej. Pablo" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Empresa</span>
                <input required name="company" autoComplete="organization" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500" placeholder="Nombre de tu empresa" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Sitio web <span className="text-slate-500">(opcional)</span></span>
                <input type="url" name="website" inputMode="url" placeholder="https://tumarca.com" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60" />
              </label>
              <button type="submit" className="w-full rounded-xl bg-white px-5 py-3.5 font-semibold text-black transition hover:-translate-y-0.5 hover:bg-cyan-100">{submitted ? "Continuar por WhatsApp" : "Solicitar diagnóstico gratuito"}</button>
              <p className="text-center text-xs leading-5 text-slate-500">Sin compromiso. No necesitas contratar nada para recibir la primera orientación.</p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
