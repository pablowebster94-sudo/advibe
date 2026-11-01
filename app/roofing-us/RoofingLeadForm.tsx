"use client";

import { FormEvent, useState } from "react";
import { trackEvent, trackMetaEvent } from "@/lib/tracking";

const whatsappNumber = "593984966335";

type Language = "en" | "es";

const labels = {
  en: {
    language: "Español",
    title: "Tell us about your roofing company",
    intro: "A few details will help us prepare a useful first conversation.",
    name: "Your full name",
    company: "Company name",
    location: "City and state",
    phone: "Phone / WhatsApp",
    email: "Business email",
    role: "Your role",
    owner: "Owner",
    manager: "Manager",
    other: "Other",
    service: "Main roofing services",
    replacement: "Roof replacement",
    repair: "Roof repair",
    commercial: "Commercial roofing",
    storm: "Storm damage",
    ads: "Are you currently running paid ads?",
    yes: "Yes",
    sometimes: "Sometimes",
    no: "Not currently",
    goal: "What would you most like to improve?",
    moreLeads: "More qualified inquiries",
    betterFollowup: "Faster lead follow-up",
    website: "A better website / landing page",
    fullSystem: "A complete lead generation system",
    consent: "I agree that AdVibe may contact me about this request.",
    submit: "Send my request on WhatsApp ↗",
    sending: "Preparing your request…",
    note: "Your details will be prepared in a WhatsApp message. You must press Send in WhatsApp to complete the request.",
    successTitle: "Your request is ready",
    successText: "WhatsApp should open with your details. Send the message there so our team can receive it.",
    reopen: "Open WhatsApp again ↗",
    edit: "Edit my answers",
    required: "Please complete all required fields and accept the contact consent.",
  },
  es: {
    language: "English",
    title: "Cuéntanos sobre tu empresa de roofing",
    intro: "Con algunos datos podremos preparar una primera conversación útil.",
    name: "Nombre completo",
    company: "Nombre de la empresa",
    location: "Ciudad y estado",
    phone: "Teléfono / WhatsApp",
    email: "Correo empresarial",
    role: "¿Cuál es tu cargo?",
    owner: "Propietario",
    manager: "Administrador",
    other: "Otro",
    service: "Servicios principales de roofing",
    replacement: "Cambio completo de techo",
    repair: "Reparación de techos",
    commercial: "Roofing comercial",
    storm: "Daños por tormentas",
    ads: "¿Actualmente haces publicidad pagada?",
    yes: "Sí",
    sometimes: "A veces",
    no: "No actualmente",
    goal: "¿Qué te gustaría mejorar principalmente?",
    moreLeads: "Más consultas calificadas",
    betterFollowup: "Seguimiento más rápido",
    website: "Una mejor página web / landing page",
    fullSystem: "Un sistema completo de captación",
    consent: "Acepto que AdVibe me contacte sobre esta solicitud.",
    submit: "Enviar solicitud por WhatsApp ↗",
    sending: "Preparando solicitud…",
    note: "Tus datos se prepararán en un mensaje de WhatsApp. Debes presionar Enviar en WhatsApp para completar la solicitud.",
    successTitle: "Tu solicitud está lista",
    successText: "WhatsApp debería abrirse con tus datos. Envía el mensaje para que nuestro equipo lo reciba.",
    reopen: "Abrir WhatsApp nuevamente ↗",
    edit: "Editar mis respuestas",
    required: "Completa los campos obligatorios y acepta el consentimiento de contacto.",
  },
};

export default function RoofingLeadForm() {
  const [language, setLanguage] = useState<Language>("en");
  const [loading, setLoading] = useState(false);
  const [messageUrl, setMessageUrl] = useState("");
  const [formError, setFormError] = useState("");
  const t = labels[language];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const fields = {
      name: String(form.get("name") || "").trim(),
      company: String(form.get("company") || "").trim(),
      location: String(form.get("location") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      email: String(form.get("email") || "").trim(),
      role: String(form.get("role") || "").trim(),
      services: form.getAll("services").map(String),
      ads: String(form.get("ads") || "").trim(),
      goal: String(form.get("goal") || "").trim(),
    };

    if (fields.services.length === 0) {
      setFormError(language === "es" ? "Selecciona al menos un servicio." : "Please select at least one roofing service.");
      setLoading(false);
      return;
    }
    setFormError("");

    const params = new URLSearchParams(window.location.search);
    const attribution = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((key) => {
        const value = params.get(key);
        return value ? `${key}: ${value}` : "";
      })
      .filter(Boolean);

    const isSpanish = language === "es";
    const message = [
      isSpanish ? "Hola AdVibe, quiero solicitar una evaluación para mi empresa de roofing." : "Hello AdVibe, I’d like to request an assessment for my roofing company.",
      "",
      `${isSpanish ? "Nombre" : "Name"}: ${fields.name}`,
      `${isSpanish ? "Empresa" : "Company"}: ${fields.company}`,
      `${isSpanish ? "Ubicación" : "Location"}: ${fields.location}`,
      `${isSpanish ? "Teléfono" : "Phone"}: ${fields.phone}`,
      `Email: ${fields.email}`,
      `${isSpanish ? "Cargo" : "Role"}: ${fields.role}`,
      `${isSpanish ? "Servicios" : "Services"}: ${fields.services.join(", ")}`,
      `${isSpanish ? "Publicidad actual" : "Current paid ads"}: ${fields.ads}`,
      `${isSpanish ? "Objetivo" : "Main goal"}: ${fields.goal}`,
      "",
      ...attribution,
      `Landing: ${window.location.href}`,
    ].join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    setMessageUrl(url);
    trackEvent("roofing_assessment_open_whatsapp", {
      market: "usa",
      industry: "roofing",
      language,
      service_count: fields.services.length,
      goal: fields.goal,
    });
    trackMetaEvent("Contact", { content_name: "Roofing business assessment", content_category: "Lead generation" }, crypto.randomUUID());
    window.open(url, "_blank", "noopener,noreferrer");
    setLoading(false);
  }

  if (messageUrl) {
    return (
      <div className="rounded-[2rem] border border-lime-300/25 bg-[#0b1117] p-7 shadow-2xl sm:p-10" aria-live="polite">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-300/10 text-2xl text-lime-300">✓</span>
        <h3 className="mt-6 text-2xl font-semibold">{t.successTitle}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-400">{t.successText}</p>
        <a href={messageUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-full bg-lime-300 px-6 py-4 text-sm font-bold text-slate-950 hover:bg-lime-200">{t.reopen}</a>
        <button type="button" onClick={() => setMessageUrl("")} className="ml-4 mt-7 text-sm text-slate-400 underline underline-offset-4 hover:text-white">{t.edit}</button>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#0b1117] p-6 shadow-2xl sm:p-9">
      <div className="mb-7 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-lime-300">AdVibe / Roofing</p>
          <h3 className="mt-3 text-2xl font-semibold">{t.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">{t.intro}</p>
        </div>
        <button type="button" onClick={() => setLanguage(language === "en" ? "es" : "en")} className="shrink-0 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-lime-300/50 hover:text-lime-200">{t.language}</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.name}><input required name="name" autoComplete="name" className={inputClass} placeholder={t.name} /></Field>
          <Field label={t.company}><input required name="company" autoComplete="organization" className={inputClass} placeholder={t.company} /></Field>
          <Field label={t.location}><input required name="location" autoComplete="address-level2" className={inputClass} placeholder="Houston, TX" /></Field>
          <Field label={t.phone}><input required name="phone" autoComplete="tel" type="tel" className={inputClass} placeholder="+1 (___) ___-____" /></Field>
          <Field label={t.email}><input required name="email" autoComplete="email" type="email" className={inputClass} placeholder="you@company.com" /></Field>
          <Field label={t.role}>
            <select required name="role" defaultValue="" className={inputClass}>
              <option value="" disabled>{t.role}</option><option value={t.owner}>{t.owner}</option><option value={t.manager}>{t.manager}</option><option value={t.other}>{t.other}</option>
            </select>
          </Field>
        </div>

        <fieldset>
          <legend className="mb-3 text-xs font-semibold text-slate-300">{t.service} <span className="text-lime-300">*</span></legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[t.replacement, t.repair, t.commercial, t.storm].map((item) => (
              <label key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">
                <input type="checkbox" name="services" value={item} className="h-4 w-4 accent-lime-300" />
                {item}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t.ads}>
            <select required name="ads" defaultValue="" className={inputClass}>
              <option value="" disabled>{t.ads}</option><option>{t.yes}</option><option>{t.sometimes}</option><option>{t.no}</option>
            </select>
          </Field>
          <Field label={t.goal}>
            <select required name="goal" defaultValue="" className={inputClass}>
              <option value="" disabled>{t.goal}</option><option>{t.moreLeads}</option><option>{t.betterFollowup}</option><option>{t.website}</option><option>{t.fullSystem}</option>
            </select>
          </Field>
        </div>

        <label className="flex items-start gap-3 text-xs leading-5 text-slate-500">
          <input required type="checkbox" className="mt-1 h-4 w-4 accent-lime-300" />
          <span>{t.consent}</span>
        </label>

        {formError ? <p role="alert" className="text-sm text-rose-300">{formError}</p> : null}
        <button type="submit" disabled={loading} className="w-full rounded-xl bg-lime-300 px-6 py-4 text-sm font-bold text-slate-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60">
          {loading ? t.sending : t.submit}
        </button>
        <p className="text-center text-[11px] leading-5 text-slate-500">{t.note}</p>
      </form>
    </div>
  );
}

const inputClass = "w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-lime-300/60 focus:ring-2 focus:ring-lime-300/10";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="block text-xs font-medium text-slate-400">{label}</span>{children}</label>;
}
