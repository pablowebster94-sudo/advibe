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
      `Sitio web: ${website}`,
    ].join("\n");

    setSubmitted(true);
    trackEvent("diagnostic_form_submitted", { source: "digital_audit_form" });
    window.open(
      `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <section id="diagnostico" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.08),transparent_35%)]" />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 overflow-hidden rounded-[2.5rem] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(8,8,8,0.94))] p-8 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              Diagnóstico digital gratuito
            </p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
              Descubre qué está frenando el crecimiento de tu marca.
            </h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Revisamos tu presencia digital, captación y experiencia comercial para detectar oportunidades concretas de mejora.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Presencia digital", "Captación de clientes", "Conversión"].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                  <span className="mb-3 block h-1.5 w-8 rounded-full bg-cyan-300" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-black/40 p-6 sm:p-8">
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Tu nombre</span>
                <input required name="name" autoComplete="name" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60" placeholder="Ej. Pablo" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Empresa</span>
                <input required name="company" autoComplete="organization" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60" placeholder="Nombre de tu empresa" />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-white">Sitio web</span>
                <input required type="url" name="website" inputMode="url" placeholder="https://tumarca.com" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60" />
              </label>

              <button type="submit" className="w-full rounded-xl bg-white px-5 py-3.5 font-semibold text-black transition hover:scale-[1.01] hover:bg-cyan-100">
                {submitted ? "Abrir WhatsApp nuevamente" : "Quiero mi diagnóstico"}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                Al enviar, se abrirá WhatsApp con tus datos para continuar el diagnóstico con AdVibe.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
