import Image, { type StaticImageData } from "next/image";
import { images } from "@/lib/images";
import { waService } from "@/lib/whatsapp";
import { Reveal } from "./Motion";
import { Eyebrow } from "./SectionHeading";
import { ArrowUpRight } from "./icons";

type Service = {
  n: string;
  title: string;
  text: string;
  image?: { src: StaticImageData; alt: string };
  className: string;
  minH: string;
  sizes?: string;
  tone?: "navy" | "steel";
};

const services: Service[] = [
  {
    n: "01",
    title: "Fachadas de vidrio",
    text: "Sistemas de aluminio y vidrio para fachadas de arquitectura contemporánea.",
    image: { src: images.fachadaVidrio, alt: "Edificio con fachada curva de vidrio" },
    className: "md:col-span-2 lg:col-span-7 lg:row-span-2",
    minH: "min-h-[460px] lg:min-h-[720px]",
    sizes: "(min-width:1024px) 58vw, 100vw",
  },
  {
    n: "02",
    title: "Alucobond",
    text: "Revestimiento arquitectónico para fachadas y proyectos comerciales.",
    image: { src: images.revestimiento, alt: "Fachada revestida con paneles y ventanas de aluminio" },
    className: "lg:col-span-5",
    minH: "min-h-[340px] lg:min-h-0",
    sizes: "(min-width:1024px) 42vw, (min-width:768px) 50vw, 100vw",
  },
  {
    n: "03",
    title: "Puertas y ventanas de aluminio",
    text: "Carpintería de aluminio en Línea 20, Línea 25 y Línea 4000 para espacios residenciales y comerciales.",
    image: { src: images.casaCorredizas, alt: "Casa con puertas corredizas de aluminio y vidrio" },
    className: "lg:col-span-5",
    minH: "min-h-[340px] lg:min-h-0",
    sizes: "(min-width:1024px) 42vw, (min-width:768px) 50vw, 100vw",
  },
  {
    n: "04",
    title: "Vidrio templado y laminado",
    text: "Aplicaciones en cerramientos, divisiones y elementos arquitectónicos.",
    image: { src: images.interiorVidrio, alt: "Cerramiento interior de vidrio con marco oscuro" },
    className: "lg:col-span-4",
    minH: "min-h-[340px] lg:min-h-[420px]",
    sizes: "(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw",
  },
  {
    n: "05",
    title: "Divisiones",
    text: "Soluciones en aluminio y vidrio para organizar ambientes.",
    image: { src: images.oficinaDivisiones, alt: "Oficina con divisiones de vidrio" },
    className: "lg:col-span-4",
    minH: "min-h-[340px] lg:min-h-[420px]",
    sizes: "(min-width:1024px) 33vw, (min-width:768px) 50vw, 100vw",
  },
  {
    n: "06",
    title: "Policarbonato",
    text: "Alternativa para cubiertas y espacios que aprovechan la luz natural.",
    className: "lg:col-span-4",
    minH: "min-h-[260px] lg:min-h-[420px]",
    tone: "navy",
  },
  {
    n: "07",
    title: "Vitrinas",
    text: "Vitrinas en aluminio y vidrio para exhibición en locales comerciales.",
    className: "lg:col-span-4",
    minH: "min-h-[260px] lg:min-h-[380px]",
    tone: "steel",
  },
  {
    n: "08",
    title: "Modulares",
    text: "Sistemas modulares en aluminio y vidrio, definidos según cada espacio.",
    image: { src: images.oficinaPasillo, alt: "Oficina con módulos de aluminio y vidrio a lo largo de un pasillo" },
    className: "md:col-span-2 lg:col-span-8",
    minH: "min-h-[340px] lg:min-h-[380px]",
    sizes: "(min-width:1024px) 66vw, 100vw",
  },
];

export function Services() {
  return (
    <section id="servicios" className="bg-white py-20 sm:py-28 lg:py-36">
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <Eyebrow index="01">Servicios</Eyebrow>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl lg:text-6xl">
              Aluminio y vidrio para cada espacio.
            </h2>
          </Reveal>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={0.1}>
            <p className="text-base leading-relaxed text-ink/80">
              Cada requerimiento se revisa según las dimensiones, los materiales y las características del proyecto. Elige un servicio para cotizarlo por WhatsApp.
            </p>
          </Reveal>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-3 md:grid-cols-2 lg:mt-20 lg:grid-cols-12 lg:gap-4">
          {services.map((s, i) => (
            <li key={s.n} className={s.className}>
              <Reveal className="h-full" delay={(i % 3) * 0.06}>
                <a
                  href={waService(s.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Cotizar ${s.title} por WhatsApp`}
                  className={`on-dark group relative flex h-full flex-col justify-end overflow-hidden p-6 text-white sm:p-8 ${
                    s.tone === "steel" ? "bg-steel" : "bg-navy"
                  } ${s.minH}`}
                >
                  {s.image && (
                    <>
                      <Image
                        src={s.image.src}
                        alt={s.image.alt}
                        fill
                        sizes={s.sizes}
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                      />
                      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/95 via-navy/35 to-navy/5" />
                      <span className="absolute right-4 top-4 bg-navy/75 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">
                        Imagen referencial
                      </span>
                    </>
                  )}
                  <div className="relative">
                    <span className="text-[11px] font-semibold tabular-nums tracking-[0.24em] text-white/75">{s.n}</span>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.02em] sm:text-[28px]">{s.title}</h3>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">{s.text}</p>
                    <span className="mt-6 inline-flex items-center gap-2 border-b border-white/50 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors group-hover:border-white">
                      Cotizar
                      <ArrowUpRight width={15} height={15} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </a>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
