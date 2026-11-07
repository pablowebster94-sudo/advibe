"use client";

import { useState } from "react";
import DemoBanner from "@/components/us/DemoBanner";
import { useLang } from "@/components/us/useLang";

const AREAS = [
  { en: ["Family petitions", "Bring your spouse, children or parents to the U.S."], es: ["Peticiones familiares", "Trae a tu esposo(a), hijos o padres a EE. UU."] },
  { en: ["Green cards", "Adjustment of status and consular processing."], es: ["Green card", "Ajuste de estatus y trámite consular."] },
  { en: ["Citizenship", "Naturalization applications and interview preparation."], es: ["Ciudadanía", "Solicitud de naturalización y preparación para la entrevista."] },
  { en: ["Work visas", "Options for workers and employers."], es: ["Visas de trabajo", "Opciones para trabajadores y empleadores."] },
  { en: ["Removal defense", "Representation in immigration court."], es: ["Defensa de deportación", "Representación en la corte de inmigración."] },
  { en: ["Humanitarian cases", "Asylum, U visas and VAWA."], es: ["Casos humanitarios", "Asilo, visas U y VAWA."] },
];

export default function LawFirmDemo() {
  const [lang, setLang] = useLang();
  const en = lang === "en";
  const [sent, setSent] = useState(false);

  return (
    <main lang={lang} className="min-h-screen bg-[#fbf9f4] text-[#18263b]">
      <DemoBanner lang={lang} onLang={setLang} />

      <header className="border-b border-[#e3e6eb] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="font-serif text-xl text-[#10284d]">Your Law Firm, P.C.</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c49a45]">{en ? "Immigration Attorney" : "Abogado de inmigración"}</p>
          </div>
          <a href="tel:+10000000000" className="rounded bg-[#10284d] px-4 py-2 text-sm font-semibold text-white">{en ? "Call for a consultation" : "Llame para una consulta"}</a>
        </div>
      </header>

      <section className="bg-[#10284d] px-4 py-16 text-white sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e5c477]">{en ? "Serving immigrant families on Long Island" : "Al servicio de familias inmigrantes en Long Island"}</p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-6xl">{en ? "Clear answers for your immigration case." : "Respuestas claras para su caso migratorio."}</h1>
            <p className="mt-5 max-w-xl text-white/75">{en ? "Honest guidance, in English or Spanish, from your first consultation to the final decision." : "Orientación honesta, en inglés o español, desde la primera consulta hasta la decisión final."}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#consult" className="rounded bg-[#c49a45] px-6 py-3 font-semibold text-[#10284d]">{en ? "Request a consultation" : "Solicitar consulta"}</a>
              <a href="https://wa.me/10000000000" className="rounded border border-white/40 px-6 py-3 font-semibold">WhatsApp</a>
            </div>
          </div>
          <div className="grid gap-3">
            {[[en ? "Bilingual" : "Bilingüe", en ? "English & Spanish" : "Inglés y español"], [en ? "Case updates" : "Actualizaciones", en ? "You always know where your case stands" : "Siempre sabe en qué va su caso"], [en ? "Flexible appointments" : "Citas flexibles", en ? "In person, phone or video" : "En persona, por teléfono o video"]].map(([a, b]) => (
              <div key={a} className="border-l-2 border-[#c49a45] bg-white/5 p-4"><p className="font-semibold">{a}</p><p className="text-sm text-white/65">{b}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c49a45]">{en ? "Practice areas" : "Áreas de práctica"}</p>
          <h2 className="mt-3 font-serif text-3xl text-[#10284d] sm:text-5xl">{en ? "How we can help" : "Cómo podemos ayudarle"}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AREAS.map((a) => {
              const [title, text] = en ? a.en : a.es;
              return (
                <article key={title} className="border-t-2 border-[#c49a45] bg-white p-5 shadow-sm">
                  <h3 className="font-serif text-xl text-[#10284d]">{title}</h3>
                  <p className="mt-2 text-sm text-[#657184]">{text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="consult" className="scroll-mt-12 bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl text-[#10284d] sm:text-4xl">{en ? "Request a consultation" : "Solicite una consulta"}</h2>
            <p className="mt-3 text-[#657184]">{en ? "Tell us briefly about your situation. Our office will contact you to schedule." : "Cuéntenos brevemente su situación. Nuestra oficina le contactará para agendar."}</p>
            <p className="mt-6 text-xs text-[#657184]">{en ? "Submitting this form does not create an attorney-client relationship. Do not include confidential information." : "Enviar este formulario no crea una relación abogado-cliente. No incluya información confidencial."}</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="grid gap-3 border border-[#e3e6eb] p-6">
            <input required placeholder={en ? "Full name" : "Nombre completo"} className="border px-3 py-2.5" />
            <input required type="tel" placeholder={en ? "Phone" : "Teléfono"} className="border px-3 py-2.5" />
            <select className="border px-3 py-2.5">
              <option>{en ? "Type of case" : "Tipo de caso"}</option>
              {AREAS.map((a) => <option key={a.en[0]}>{en ? a.en[0] : a.es[0]}</option>)}
            </select>
            <select className="border px-3 py-2.5"><option>{en ? "Preferred language: English" : "Idioma preferido: español"}</option><option>{en ? "Preferred language: Spanish" : "Idioma preferido: inglés"}</option></select>
            <button className="mt-1 bg-[#10284d] py-3 font-semibold text-white">{en ? "Send request" : "Enviar solicitud"}</button>
            {sent && <p className="bg-lime-100 p-3 text-sm">{en ? "Demo: on a live site this request reaches the office by email and WhatsApp." : "Demo: en una web real esta solicitud llega a la oficina por correo y WhatsApp."}</p>}
          </form>
        </div>
      </section>

      <footer className="bg-[#10284d] px-4 py-8 text-xs text-white/55 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-2">
          <p className="font-semibold uppercase tracking-wider text-white/80">Attorney Advertising</p>
          <p>{en ? "Prior results do not guarantee a similar outcome. The information on this website is general and is not legal advice." : "Resultados anteriores no garantizan un resultado similar. La información de esta web es general y no constituye asesoría legal."}</p>
          <p>{en ? "Demo website designed by AdVibe Agency. Fictional law firm." : "Web de muestra diseñada por AdVibe Agencia. Firma ficticia."}</p>
        </div>
      </footer>
    </main>
  );
}
