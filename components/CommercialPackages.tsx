const plans = [
  { name: "Básico", audience: "Para negocios que quieren comenzar a destacar", price: 120, videos: 5, featured: false },
  { name: "Estándar", audience: "Para marcas que necesitan contenido constante", price: 150, videos: 6, featured: true },
  { name: "Pro", audience: "Para negocios que quieren acelerar su presencia", price: 250, videos: 8, featured: false },
];

const services = [
  { title: "Producción audiovisual", description: "Reels, videos comerciales, fotografía y cobertura de eventos.", detail: "Cotización según alcance y producción." },
  { title: "Meta Ads y captación", description: "Campañas enfocadas en conversaciones, prospectos y oportunidades comerciales.", detail: "Gestión y presupuesto publicitario por separado." },
  { title: "Páginas web", description: "Landing pages, sitios corporativos y soluciones digitales conectadas a WhatsApp.", detail: "Precio según funcionalidades." },
  { title: "IA y automatización", description: "Chatbots, seguimiento de prospectos y flujos de atención para tu negocio.", detail: "Implementación personalizada." },
];

function QuoteLink({ message, featured = false }: { message: string; featured?: boolean }) {
  return (
    <a
      href={`https://wa.me/593984966335?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-auto inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 ${featured ? "bg-lime-300 text-slate-950 hover:bg-lime-200" : "border border-white/20 bg-white/10 text-white hover:border-lime-300/60"}`}
    >
      Solicitar cotización ↗
    </a>
  );
}

export default function CommercialPackages() {
  return (
    <section id="planes" aria-labelledby="planes-title" className="relative border-y border-white/10 bg-[#090d10] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-xs font-bold uppercase tracking-[0.32em] text-lime-300">Planes y soluciones</p>
        <h2 id="planes-title" className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.055em] text-white sm:text-6xl">
          Contenido que destaca. <span className="text-lime-300">Estrategia que impulsa.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400">
          Precios claros para empezar. Producción con guion, grabación, edición y publicación. Todos los precios incluyen IVA.
        </p>
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <article key={plan.name} className={`relative flex flex-col rounded-[1.6rem] border p-7 sm:p-9 ${plan.featured ? "border-lime-300 bg-[#17201b]" : "border-white/15 bg-white/[0.035]"}`}>
              {plan.featured && <span className="mb-5 w-fit rounded-full bg-lime-300 px-3 py-1 text-xs font-bold text-slate-950">Más elegido</span>}
              <h3 className="text-3xl font-extrabold text-white">{plan.name}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{plan.audience}</p>
              <div className="mt-7 flex items-baseline gap-2 border-b border-white/10 pb-7">
                <span className="text-sm text-slate-400">Desde</span>
                <strong className="text-5xl font-black tracking-tight text-lime-300">${plan.price}</strong>
                <span className="text-sm text-slate-400">/mes</span>
              </div>
              <ul className="my-8 space-y-4 text-sm text-slate-200">
                {[ `${plan.videos} videos mensuales`, "Guion y planificación", "Grabación y edición", "Publicación del contenido", "IVA incluido" ].map((feature) => (
                  <li key={feature} className="flex gap-3"><span className="text-lime-300" aria-hidden="true">✓</span>{feature}</li>
                ))}
              </ul>
              <QuoteLink featured={plan.featured} message={`Hola, quiero información sobre el plan ${plan.name} de AdVibe desde $${plan.price} al mes.`} />
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-500">La gestión de Meta Ads se cotiza aparte. El presupuesto de anuncios lo define cada cliente. El alcance y las ventas dependen de múltiples factores y no se garantizan.</p>
        <div className="mt-24">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-lime-300">Más soluciones</p>
          <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Todo lo que tu marca necesita para crecer.</h3>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {services.map((service) => (
              <article key={service.title} className="flex flex-col rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-7 sm:p-9">
                <h4 className="text-2xl font-bold text-white">{service.title}</h4>
                <p className="mt-4 text-sm leading-7 text-slate-300">{service.description}</p>
                <p className="mb-7 mt-3 text-xs text-slate-500">{service.detail}</p>
                <QuoteLink message={`Hola, quiero cotizar ${service.title} con AdVibe.`} />
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
