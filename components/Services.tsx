const main = [
  {
    number: "01",
    title: "Desarrollo web y landing pages",
    label: "La base de tu presencia digital",
    benefit: "Sitios web rápidos, claros y diseñados para que tus clientes entiendan tu oferta y den el siguiente paso.",
    points: ["Webs corporativas y páginas de servicios", "Landing pages para campañas y captación", "Ecommerce, catálogos y formularios"],
    href: "/diagnostico?service=web",
    cta: "Planificar mi página web",
  },
  {
    number: "02",
    title: "Sistemas de captación y Meta Ads",
    label: "Tráfico que llega con intención",
    benefit: "Conectamos campañas, páginas y seguimiento para atraer prospectos y medir qué acciones generan oportunidades.",
    points: ["Campañas en Facebook e Instagram", "Formularios y rutas de conversión", "Medición, seguimiento y optimización"],
    href: "/diagnostico?service=ads",
    cta: "Mejorar mi captación",
  },
  {
    number: "03",
    title: "Contenido audiovisual",
    label: "Creatividad con propósito comercial",
    benefit: "Producimos videos y piezas visuales que explican tu propuesta, generan confianza y alimentan tus campañas.",
    points: ["Videos comerciales y reels", "Fotografía de producto y espacios", "Creatividades para anuncios"],
    href: "/diagnostico?service=video",
    cta: "Crear contenido para mi marca",
  },
];

const extras = ["SEO local", "Ecommerce", "CRM y seguimiento", "Automatización", "Chatbots e IA", "Branding e identidad visual"];

export default function Services() {
  return (
    <section id="servicios" className="relative bg-[#05070a] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Qué hacemos</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Un sistema digital. Cada pieza con un propósito.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
            Diseñamos la infraestructura, atraemos a las personas adecuadas y facilitamos el siguiente paso. Puedes contratar una solución puntual o integrar varias capacidades en un mismo proyecto.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {main.map((service) => (
            <article key={service.number} className="group flex flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 transition-colors duration-300 hover:border-lime-300/40 sm:p-9">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs tracking-[0.2em] text-lime-300">{service.number}</span>
                <span className="h-px w-12 bg-white/15 transition-all group-hover:w-20 group-hover:bg-lime-300/70" />
              </div>
              <p className="mt-9 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">{service.label}</p>
              <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.03em] text-white">{service.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-300">{service.benefit}</p>
              <ul className="mt-7 space-y-3 border-t border-white/10 pt-7">
                {service.points.map((point) => <li key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-400"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-300" />{point}</li>)}
              </ul>
              <a href={service.href} className="mt-auto inline-flex w-fit items-center pt-9 text-sm font-semibold text-lime-300 transition hover:text-lime-200">{service.cta}<span className="ml-2 transition-transform group-hover:translate-x-1">→</span></a>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="shrink-0 text-sm font-semibold text-slate-300">Capacidades complementarias</p>
          <ul className="flex flex-wrap gap-2">
            {extras.map((extra) => <li key={extra} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-400">{extra}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
