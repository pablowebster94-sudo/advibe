import Image from "next/image";
import { images } from "@/lib/images";
import { site } from "@/lib/site";
import { WA_DEFAULT, waLink } from "@/lib/whatsapp";
import { Reveal } from "./Motion";
import { Eyebrow } from "./SectionHeading";
import { ArrowUpRight } from "./icons";

export function About() {
  return (
    <section id="nosotros" className="bg-mist py-20 sm:py-28 lg:py-36">
      <div className="container-site grid gap-12 lg:grid-cols-12 lg:gap-10">
        <Reveal className="lg:col-span-6">
          <figure className="relative">
            <div className="relative aspect-[4/5] overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src={images.salaEstar}
                alt="Sala contemporánea con ventanales de marco oscuro"
                fill
                sizes="(min-width:1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 text-[11px] font-medium uppercase tracking-[0.18em] text-ink/70">Imagen referencial</figcaption>
          </figure>
        </Reveal>

        <div className="lg:col-span-5 lg:col-start-8 lg:pt-16">
          <Reveal>
            <Eyebrow index="02">Nosotros</Eyebrow>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl">
              Técnica, arte y belleza en cada proyecto
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 text-base leading-relaxed text-ink/85 sm:text-lg">
              En ALVITEC trabajamos el aluminio y el vidrio para proyectos residenciales y comerciales: fachadas, puertas, ventanas, divisiones, vitrinas y revestimientos.
            </p>
            <p className="mt-5 text-base leading-relaxed text-ink/85">
              Atendemos desde nuestro local en {site.address.street}, {site.address.city}. Cada solicitud se revisa de forma individual: medidas, materiales y condiciones del espacio definen la propuesta.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <blockquote className="mt-10 border-l-2 border-steel pl-6 font-display text-xl font-medium leading-snug tracking-[-0.01em] text-navy sm:text-2xl">
              “{site.slogan}”
            </blockquote>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-10 border-t border-navy/15 pt-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-steel">Cobertura</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {site.coverage.map((c) => (
                  <li key={c} className="border border-navy/20 bg-white px-3.5 py-2 text-[13px] font-medium text-navy">{c}</li>
                ))}
              </ul>
            </div>
            <a href={waLink(WA_DEFAULT)} target="_blank" rel="noopener noreferrer" className="btn-primary mt-10">
              Conversemos sobre tu proyecto
              <ArrowUpRight width={17} height={17} />
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
