const groups = [
  {
    eyebrow: "Contenido que conecta",
    title: "Producción audiovisual",
    description: "Creamos piezas visuales que presentan tus productos, cuentan tu historia y hacen que tu marca destaque.",
    items: ["Reels y videos para redes sociales", "Videos promocionales e institucionales", "Fotografía de productos y espacios", "Cobertura audiovisual de eventos", "Videoclips y producción completa"],
    whatsapp: "Hola, quiero cotizar una producción audiovisual con AdVibe.",
  },
  {
    eyebrow: "Creatividad + performance",
    title: "Marketing y publicidad digital",
    description: "Estrategia y campañas para llegar a las personas correctas y convertir la atención en oportunidades comerciales.",
    items: ["Gestión de campañas Meta Ads", "Estrategia de contenido para redes", "Creatividades publicitarias", "Optimización y seguimiento de campañas", "Análisis de resultados"],
    whatsapp: "Hola, quiero información sobre marketing y publicidad digital con AdVibe.",
  },
  {
    eyebrow: "Tecnología para crecer",
    title: "Web, automatización e IA",
    description: "Herramientas digitales para que tu negocio tenga presencia profesional y gestione mejor sus oportunidades.",
    items: ["Páginas web y landing pages", "Branding e identidad visual", "CRM y seguimiento de prospectos", "Chatbots y automatización de procesos", "Soluciones con inteligencia artificial"],
    whatsapp: "Hola, quiero cotizar una solución web o de automatización con AdVibe.",
  },
];

export default function Services() {
  return (
    <section id="servicios" className="relative bg-[#05070a] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Lo que hacemos</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Creatividad, estrategia y tecnología para hacer crecer tu marca.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
            Desde una pieza audiovisual hasta una estrategia digital completa. Diseñamos soluciones según los objetivos de cada negocio.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {groups.map((group, index) => (
            <article key={group.title} className="group flex flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 transition duration-300 hover:-translate-y-1 hover:border-lime-300/40 sm:p-9">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-semibold tracking-[-0.06em] text-lime-300">0{index + 1}</span>
                <span className="h-px w-16 bg-lime-300/40" />
              </div>
              <p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.24em] text-lime-300/80">{group.eyebrow}</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">{group.title}</h3>
              <p className="mt-4 min-h-24 text-sm leading-7 text-slate-300">{group.description}</p>
              <ul className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-6">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-400">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <a href={`https://wa.me/593984966335?text=${encodeURIComponent(group.whatsapp)}`} target="_blank" rel="noreferrer" className="mt-9 inline-flex w-fit items-center text-sm font-semibold text-lime-300 transition hover:text-lime-200">
                Cotizar servicio <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </a>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-lime-300/15 bg-lime-300/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-white">¿Tienes un proyecto específico?</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">Transmisiones en vivo, aplicaciones y proyectos especiales se cotizan según sus requerimientos.</p>
          </div>
          <a href={`https://wa.me/593984966335?text=${encodeURIComponent("Hola, quiero conversar sobre un proyecto especial con AdVibe.")}`} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center rounded-full bg-lime-400 px-5 py-3 text-sm font-semibold text-[#07101a] transition hover:bg-lime-300">Cuéntanos tu idea ↗</a>
        </div>
      </div>
    </section>
  );
}
