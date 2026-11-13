import Image from "next/image";
import { images } from "@/lib/images";
import { site } from "@/lib/site";
import { WA_DEFAULT, waLink } from "@/lib/whatsapp";
import { ArrowRight, WhatsAppIcon } from "./icons";

export function Hero() {
  return (
    <section id="inicio" className="on-dark relative isolate flex min-h-[640px] flex-col justify-end overflow-hidden bg-navy text-white" style={{ height: "100svh" }}>
      <Image
        src={images.hero}
        alt="Casa contemporánea con grandes superficies de vidrio al atardecer (imagen referencial)"
        fill
        priority
        sizes="100vw"
        quality={72}
        className="-z-20 object-cover object-[68%_center] lg:object-center"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-navy via-navy/55 to-navy/35" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-navy/70 via-navy/20 to-transparent" />

      <div className="container-site pb-10 pt-32 sm:pb-14">
        <div className="grid items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85">
              <span aria-hidden className="h-px w-10 bg-white/60" />
              Aluminio y vidrio · Guayaquil
            </p>
            <h1 className="mt-6 max-w-[14ch] text-[clamp(2.6rem,7.4vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
              Arquitectura que transforma espacios
            </h1>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
              Fachadas de vidrio, puertas y ventanas de aluminio, divisiones y revestimientos. Cuéntanos tu proyecto y recibe tu cotización por WhatsApp.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={waLink(WA_DEFAULT)} target="_blank" rel="noopener noreferrer" className="btn-light">
                <WhatsAppIcon width={18} height={18} />
                Solicitar cotización
              </a>
              <a href="#configurador" className="btn-ghost-light">
                Configurar mi proyecto
                <ArrowRight width={18} height={18} />
              </a>
            </div>
          </div>

          <dl className="hidden gap-6 border-l border-white/25 pl-6 text-sm lg:col-span-3 lg:col-start-10 lg:grid">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Dirección</dt>
              <dd className="mt-1.5 text-white/95">{site.address.street}, {site.address.city}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">Horario</dt>
              <dd className="mt-1.5 text-white/95">
                {site.hours.map((h) => (
                  <span key={h.label} className="block">{h.label} · {h.value}</span>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-white/20 pt-5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/75 sm:mt-14 sm:pr-20">
          <span>“{site.slogan}”</span>
          <span>Imagen referencial</span>
        </div>
      </div>
    </section>
  );
}
