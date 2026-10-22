const main = [
  {
    icon: "▶",
    title: "Contenido y video",
    benefit: "Videos que la gente mira hasta el final y recuerda.",
    points: ["Reels y sketches con guion", "Videos de producto e institucionales", "Fotografía profesional"],
    whatsapp: "Hola, quiero cotizar contenido y video para mi negocio.",
  },
  {
    icon: "◎",
    title: "Meta Ads",
    benefit: "Anuncios en Facebook e Instagram que traen mensajes a tu WhatsApp.",
    points: ["Campañas a personas de tu zona", "Creatividades hechas para vender", "Seguimiento y optimización semanal"],
    whatsapp: "Hola, quiero que revisen mis anuncios de Facebook e Instagram.",
  },
  {
    icon: "◇",
    title: "Web y Google",
    benefit: "Que te encuentren cuando buscan lo que vendes.",
    points: ["Páginas web y landing pages", "Ficha de Google optimizada", "WhatsApp y formularios conectados"],
    whatsapp: "Hola, quiero información sobre páginas web y Google para mi negocio.",
  },
];

const extras = [
  "Gestión de redes sociales",
  "Branding e identidad visual",
  "Cobertura de eventos",
  "Automatización y chatbots",
  "CRM y seguimiento de clientes",
  "Inteligencia artificial",
  "Consultoría estratégica",
];

export default function Services() {
  return (
    <section id="servicios" className="relative bg-[#05070a] py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Servicios</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Tres formas de traer más clientes a tu negocio.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
            Elegimos solo lo que tu negocio necesita. Muchas veces la mejor combinación es contenido + anuncios.
          </p>
        </div>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {main.map((service) => (
            <article
              key={service.title}
              className="group flex flex-col rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 transition-colors duration-300 hover:border-lime-300/40 sm:p-10"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 text-lg text-lime-300 transition-colors duration-300 group-hover:border-lime-300/40 group-hover:bg-lime-300/10">
                {service.icon}
              </span>
              <h3 className="mt-7 text-2xl font-semibold tracking-[-0.03em] text-white">{service.title}</h3>
              <p className="mt-3 text-base leading-7 text-slate-300">{service.benefit}</p>
              <ul className="mt-7 space-y-3 border-t border-white/10 pt-7">
                {service.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm leading-6 text-slate-400">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-300" />
                    {point}
                  </li>
                ))}
              </ul>
              <a
                href={`https://wa.me/593984966335?text=${encodeURIComponent(service.whatsapp)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex w-fit items-center pt-9 text-sm font-semibold text-lime-300 transition hover:text-lime-200"
              >
                Cotizar por WhatsApp <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </a>
            </article>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
          <p className="shrink-0 text-sm font-semibold text-slate-300">También hacemos:</p>
          <ul className="flex flex-wrap gap-2">
            {extras.map((extra) => (
              <li key={extra} className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-400">
                {extra}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
