"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  const [market, setMarket] = useState("ecuador");
  const [service, setService] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const incomingMarket = params.get("market");
    const incomingService = params.get("service");
    if (incomingMarket === "usa" || incomingMarket === "ecuador") setMarket(incomingMarket);
    if (incomingService === "web") setService("Web / Landing Page");
    if (incomingService === "ads") setService("Lead generation / Meta Ads");
    if (incomingService === "video") setService("Contenido audiovisual");
  }, []);

  const isUS = market === "usa";
  const copy = isUS
    ? {
        eyebrow: "Free project strategy review",
        title: "Is your website helping you win more jobs?",
        intro: "Tell us about your business and what you want to improve. We’ll review your digital presence and identify practical next steps.",
        formTitle: "Tell us about your project",
        formIntro: "A few details help us prepare a useful first conversation.",
        name: "Full name",
        company: "Business name",
        website: "Current website (optional)",
        phone: "Phone / WhatsApp",
        email: "Business email",
        market: "Where is your business located?",
        industry: "What industry are you in?",
        service: "What do you need?",
        ads: "Are you currently running paid ads?",
        budget: "Estimated project budget (USD)",
        contact: "How should we contact you?",
        consent: "I agree that AdVibe may use this information to contact me about my project.",
        submit: "Request my free review ↗",
        process: "What happens next",
        steps: [["01", "Review", "We review your website, offer and lead journey."], ["02", "Conversation", "We discuss priorities, fit and next steps."], ["03", "Proposal", "If there’s a fit, we prepare a clear project proposal."]],
        footer: "Websites and lead generation systems for contractors and service businesses.",
      }
    : {
        eyebrow: "Diagnóstico estratégico gratuito",
        title: "¿Tu página web está ayudando a conseguir más clientes?",
        intro: "Cuéntanos sobre tu negocio y qué quieres mejorar. Revisaremos tu presencia digital y detectaremos oportunidades concretas.",
        formTitle: "Cuéntanos sobre tu proyecto",
        formIntro: "Unos datos básicos nos ayudan a preparar una primera conversación útil.",
        name: "Nombre completo",
        company: "Nombre del negocio o empresa",
        website: "Página web actual (opcional)",
        phone: "Teléfono / WhatsApp",
        email: "Correo electrónico",
        market: "¿Dónde está tu negocio?",
        industry: "¿A qué se dedica tu negocio?",
        service: "¿Qué necesitas?",
        ads: "¿Actualmente inviertes en publicidad?",
        budget: "Presupuesto estimado del proyecto (USD)",
        contact: "¿Cómo prefieres que te contactemos?",
        consent: "Acepto que AdVibe utilice estos datos para contactarme sobre mi proyecto.",
        submit: "Solicitar diagnóstico gratuito ↗",
        process: "Qué sucede después",
        steps: [["01", "Revisión", "Analizamos tu web, oferta y proceso de captación."], ["02", "Conversación", "Revisamos prioridades y próximos pasos contigo."], ["03", "Propuesta", "Si existe encaje, preparamos una propuesta clara."]],
        footer: "Desarrollo web y sistemas de captación para empresas en Ecuador y Estados Unidos.",
      };

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
      market: String(form.get("market") || market),
      industry: String(form.get("industry") || "").trim(),
      service: String(form.get("service") || "").trim(),
      ads: String(form.get("ads") || "").trim(),
      budget: String(form.get("budget") || "").trim(),
      contact: String(form.get("contact") || "").trim(),
    };

    const eventId = crypto.randomUUID();
    trackEvent("diagnostic_form_submit", { source: "diagnostic_landing", market: data.market, service: data.service, budget: data.budget });
    trackMetaEvent("Lead", { content_name: "AdVibe project diagnosis", content_category: data.service, market: data.market }, eventId);
    const testEventCode = new URLSearchParams(window.location.search).get("test_event_code") || undefined;
    await sendCapiEvent({ eventName: "Lead", eventId, email: data.email, phone: data.phone, testEventCode });

    const english = data.market === "usa";
    const message = [
      english ? "Hello AdVibe, I’d like to request a project review." : "Hola AdVibe, quiero solicitar un diagnóstico de mi proyecto.",
      "",
      `${english ? "Name" : "Nombre"}: ${data.name}`,
      `${english ? "Business" : "Empresa"}: ${data.company}`,
      `${english ? "Website" : "Web"}: ${data.website || (english ? "Not provided" : "No indicada")}`,
      `${english ? "Phone" : "Teléfono"}: ${data.phone}`,
      `Email: ${data.email}`,
      `${english ? "Market" : "Mercado"}: ${data.market}`,
      `${english ? "Industry" : "Sector"}: ${data.industry}`,
      `${english ? "Service needed" : "Servicio"}: ${data.service}`,
      `${english ? "Currently running ads" : "Publicidad actual"}: ${data.ads}`,
      `${english ? "Project budget" : "Presupuesto del proyecto"}: ${data.budget}`,
      `${english ? "Preferred contact" : "Contacto preferido"}: ${data.contact}`,
      `FBC: ${getFbc() || "Not available"}`,
    ].join("\\n");

    if (bookingUrl && data.contact === "Schedule a call") {
      const params = new URLSearchParams({ name: data.name, email: data.email, a1: data.phone });
      window.location.href = `${bookingUrl}${bookingUrl.includes("?") ? "&" : "?"}${params.toString()}`;
      return;
    }

    window.location.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="font-semibold tracking-tight">AdVibe<span className="text-lime-300">.</span></Link>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/ecuador" className="text-slate-400 hover:text-white">Ecuador</Link>
            <Link href="/usa" className="text-slate-400 hover:text-white">United States</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(163,230,53,0.12),transparent_28%),radial-gradient(circle_at_10%_70%,rgba(34,211,238,0.08),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-lime-300">{copy.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.055em] sm:text-7xl">{copy.title}</h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">{copy.intro}</p>
            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
              {(isUS ? ["Website and conversion", "Lead generation", "Paid traffic", "CRM and follow-up"] : ["Desarrollo web y conversión", "Captación de clientes", "Publicidad y contenido", "WhatsApp y seguimiento"]).map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-200"><span className="mr-2 text-lime-300">✓</span>{item}</div>
              ))}
            </div>
            <p className="mt-8 text-sm text-slate-500">{copy.footer}</p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-lime-300">{isUS ? "Project intake" : "Solicitud de proyecto"}</p>
              <h2 className="mt-3 text-2xl font-semibold">{copy.formTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{copy.formIntro}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input required name="name" autoComplete="name" placeholder={copy.name} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
              <input required name="company" autoComplete="organization" placeholder={copy.company} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
              <input name="website" type="url" placeholder={copy.website} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
              <div className="grid gap-4 sm:grid-cols-2">
                <input required name="phone" autoComplete="tel" placeholder={copy.phone} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
                <input required name="email" type="email" autoComplete="email" placeholder={copy.email} className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-white outline-none focus:border-lime-300/60" />
              </div>
              <select required name="market" value={market} onChange={(e) => setMarket(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3.5 text-white outline-none focus:border-lime-300/60">
                <option value="ecuador">Ecuador</option><option value="usa">United States</option><option value="other">Other</option>
              </select>
              <select required name="industry" defaultValue="" className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3.5 text-white outline-none focus:border-lime-300/60">
                <option value="" disabled>{isUS ? "Select your industry" : "Selecciona tu sector"}</option>
                {["Home services / Contractors", "Roofing", "Remodeling", "Painting", "HVAC", "Automotriz", "Retail / Comercio", "Salud / Bienestar", "Inmobiliario", "Educación", "Otro"].map((item) => <option key={item}>{item}</option>)}
              </select>
              <select required name="service" value={service} onChange={(e) => setService(e.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3.5 text-white outline-none focus:border-lime-300/60">
                <option value="" disabled>{copy.service}</option>
                <option>Web / Landing Page</option><option>Web corporativa / Ecommerce</option><option>Lead generation / Meta Ads</option><option>Contenido audiovisual</option><option>CRM / Automatización</option><option>Sistema digital integral</option>
              </select>
              <select required name="ads" defaultValue="" className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3.5 text-white outline-none focus:border-lime-300/60">
                <option value="" disabled>{copy.ads}</option>
                <option>{isUS ? "Yes, actively" : "Sí, actualmente"}</option><option>{isUS ? "Sometimes" : "A veces"}</option><option>{isUS ? "Not yet" : "Todavía no"}</option>
              </select>
              <select required name="budget" defaultValue="" className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3.5 text-white outline-none focus:border-lime-300/60">
                <option value="" disabled>{copy.budget}</option>
                <option>Menos de $300</option><option>$300 – $600</option><option>$600 – $1,200</option><option>$1,200 – $2,500</option><option>$2,500+</option><option>{isUS ? "Not sure yet" : "Aún no lo sé"}</option>
              </select>
              <select required name="contact" defaultValue="" className="w-full rounded-xl border border-white/10 bg-[#0b0b0b] px-4 py-3.5 text-white outline-none focus:border-lime-300/60">
                <option value="" disabled>{copy.contact}</option>
                <option>WhatsApp</option><option>{isUS ? "Phone call" : "Llamada telefónica"}</option><option>Email</option><option>Schedule a call</option>
              </select>
              <label className="flex items-start gap-3 text-xs leading-5 text-slate-500"><input required type="checkbox" className="mt-1 accent-lime-300" /><span>{copy.consent}</span></label>
              <button disabled={loading} className="w-full rounded-xl bg-lime-300 px-5 py-4 font-semibold text-slate-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60">{loading ? (isUS ? "Preparing…" : "Enviando…") : copy.submit}</button>
            </form>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#080808] py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 sm:grid-cols-3">
          {copy.steps.map(([number, title, text]) => <div key={number} className="border-t border-white/10 pt-5"><span className="font-mono text-xs text-lime-300">{number}</span><h3 className="mt-3 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p></div>)}
        </div>
      </section>
    </main>
  );
}
