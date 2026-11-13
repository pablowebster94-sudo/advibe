"use client";

import { useInView } from "framer-motion";
import { useRef, useState } from "react";
import { MAPS_EMBED_URL, MAPS_LINK_URL, serviceNames, site } from "@/lib/site";
import { buildMessage, waLink } from "@/lib/whatsapp";
import { Eyebrow } from "./SectionHeading";
import { ArrowUpRight, FacebookIcon, InstagramIcon, WhatsAppIcon } from "./icons";

export function Contact() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapVisible = useInView(mapRef, { once: true, margin: "400px" });
  const [form, setForm] = useState({ nombre: "", servicio: "", mensaje: "" });
  const upd = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = buildMessage("Hola ALVITEC, quiero solicitar información.", [
      ["Nombre", form.nombre],
      ["Servicio de interés", form.servicio],
      ["Mensaje", form.mensaje],
    ]);
    // Sin "noopener" en features para poder detectar un bloqueo de pop-ups y navegar en la misma pestaña.
    const win = window.open(waLink(text), "_blank");
    if (win) win.opener = null;
    else window.location.href = waLink(text);
  };

  return (
    <section id="contacto" className="on-dark bg-navy py-20 text-white sm:py-28 lg:py-36">
      <div className="container-site">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow index="08" dark>Contacto</Eyebrow>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-5xl lg:text-6xl">Hablemos de tu proyecto.</h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
              Escríbenos por WhatsApp o visítanos en nuestro local. Cuéntanos qué necesitas y preparamos tu cotización.
            </p>

            <dl className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Dirección</dt>
                <dd className="mt-2 text-[15px] leading-relaxed">
                  {site.address.street}
                  <br />
                  {site.address.city}, {site.address.country}
                  <a href={MAPS_LINK_URL} target="_blank" rel="noopener noreferrer" className="mt-2 flex min-h-[44px] items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90 hover:text-white">
                    <span className="border-b border-white/50 pb-0.5">Cómo llegar</span>
                    <ArrowUpRight width={14} height={14} />
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Horario</dt>
                <dd className="mt-2 text-[15px] leading-relaxed">
                  {site.hours.map((h) => (
                    <span key={h.label} className="block">
                      {h.label}: {h.value}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">WhatsApp</dt>
                <dd className="mt-2 text-[15px]">
                  <a href={waLink()} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center gap-2 hover:underline">
                    <WhatsAppIcon width={17} height={17} />
                    {site.whatsappDisplay}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Redes</dt>
                <dd className="mt-2 text-[15px]">
                  <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center gap-2 hover:underline">
                    <InstagramIcon width={17} height={17} />
                    {site.instagram.handle}
                  </a>
                  <a href={site.facebook.url} target="_blank" rel="noopener noreferrer" className="flex min-h-[44px] items-center gap-2 hover:underline">
                    <FacebookIcon width={17} height={17} className="shrink-0" />
                    {site.facebook.name}
                  </a>
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <form onSubmit={onSubmit} className="bg-white p-6 text-ink sm:p-10" aria-labelledby="form-title">
              <h3 id="form-title" className="text-2xl font-semibold tracking-[-0.02em] text-navy sm:text-3xl">Escríbenos</h3>
              <p className="mt-2 text-sm text-ink/75">Al enviar se abre WhatsApp con tu mensaje listo.</p>
              <div className="mt-8 grid gap-5">
                <div>
                  <label htmlFor="c-nombre" className="field-label">Nombre</label>
                  <input id="c-nombre" name="nombre" required autoComplete="name" className="field" placeholder="Nombre y apellido" value={form.nombre} onChange={upd("nombre")} maxLength={80} />
                </div>
                <div>
                  <label htmlFor="c-servicio" className="field-label">Servicio de interés</label>
                  <select id="c-servicio" name="servicio" className="field appearance-none" value={form.servicio} onChange={upd("servicio")}>
                    <option value="">Selecciona una opción (opcional)</option>
                    {serviceNames.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="c-mensaje" className="field-label">Mensaje</label>
                  <textarea id="c-mensaje" name="mensaje" required className="field min-h-[130px] resize-y" placeholder="Ej. 2 ventanas corredizas, medidas aproximadas y ubicación…" value={form.mensaje} onChange={upd("mensaje")} maxLength={800} />
                </div>
                <button type="submit" className="btn bg-[#0F7A41] text-white hover:bg-[#0B6535]">
                  <WhatsAppIcon width={18} height={18} />
                  Enviar por WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>

        <div ref={mapRef} className="relative mt-16 h-[340px] w-full overflow-hidden bg-steel/40 sm:h-[440px] lg:mt-24">
          {mapVisible ? (
            <iframe
              title={`Mapa de ubicación de ALVITEC: ${site.address.street}, ${site.address.city}`}
              src={MAPS_EMBED_URL}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="h-full w-full border-0"
            />
          ) : (
            <a href={MAPS_LINK_URL} target="_blank" rel="noopener noreferrer" className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase tracking-[0.16em]">
              Ver ubicación en Google Maps
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
