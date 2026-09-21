"use client";

import { FormEvent, useState } from "react";
import { trackEvent, trackLead, trackWhatsAppOpen } from "@/lib/tracking";

const whatsappNumber = "593984966335";

export default function DigitalAudit() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const company = String(form.get("company") || "").trim();
    const objective = String(form.get("objective") || "").trim();

    const message = [
      "Hola AdVibe, quiero solicitar un diagnóstico de mi presencia digital.",
      "",
      `Nombre: ${name}`,
      `Empresa: ${company}`,
      `Objetivo principal: ${objective}`,
    ].join("\n");

    setSubmitted(true);
    trackEvent("submit_contact_form", { source: "digital_audit_form" });
    trackWhatsAppOpen("digital_audit_form");
    trackLead({ source: "digital_audit_form", cta: "diagnostic_form_submitted" });
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <section id="diagnostico" className="relative overflow-hidden py-24 sm:py-28 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.08),transparent_35%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 overflow-hidden rounded-[2.5rem] border border-cyan-400/15 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(8,8,8,0.94))] p-8 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:p-14">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Diagnóstico digital gratuito</p>
            <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">Descubre qué está frenando el crecimiento de tu marca.</h2>
            <p className="mt-6 text-lg leading-8 text-slate-300">Revisamos tu presencia digital, captación y experiencia comercial para detectar oportunidades concretas de mejora.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">{["Presencia digital","Captación de clientes","Conversión"].map((item) => <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200"><span className="mb-3 block h-1.5 w-8 rounded-full bg-cyan-300" />{item}</div>)}</div>
            <a href="/diagnostico" className="mt-8 inline-flex rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-lime-200">Solicitar diagnóstico ↗</a>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-black/40 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Diagnóstico estratégico</p>
            <h3 className="mt-3 text-2xl font-semibold text-white">Una revisión útil, no una llamada genérica.</h3>
            <p className="mt-4 leading-7 text-slate-400">Cuéntanos qué haces, dónde estás invirtiendo y qué quieres mejorar. Después podrás solicitar tu sesión.</p>
            <a href="/diagnostico" className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-white px-5 py-4 font-semibold text-black hover:bg-cyan-100">Quiero mi diagnóstico</a>
          </div>
        </div>
      </div>
    </section>
  );
}
