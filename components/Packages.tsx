const packages = [
  {
    name: "Básico",
    videos: "5 videos al mes",
    price: "120",
    featured: false,
    whatsapp: "Hola, quiero cotizar el paquete Básico de 5 videos al mes.",
  },
  {
    name: "Estándar",
    videos: "6 videos al mes",
    price: "150",
    featured: true,
    whatsapp: "Hola, quiero cotizar el paquete Estándar de 6 videos al mes.",
  },
  {
    name: "Pro",
    videos: "8 videos al mes",
    price: "250",
    featured: false,
    whatsapp: "Hola, quiero cotizar el paquete Pro de 8 videos al mes.",
  },
];

const included = ["Guion", "Grabación", "Edición", "Publicación"];

export default function Packages() {
  return (
    <section id="paquetes" className="relative bg-[#05070a] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Paquetes mensuales</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Contenido todos los meses, sin improvisar.
          </h2>
          <p className="mt-5 text-base leading-7 text-slate-400 sm:text-lg">
            Cada paquete incluye guion, grabación, edición y publicación.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:mt-14 lg:grid-cols-3">
          {packages.map((pack) => (
            <article
              key={pack.name}
              className={`group relative flex flex-col rounded-[1.75rem] border bg-white/[0.03] p-7 transition-colors duration-300 sm:p-10 ${
                pack.featured ? "border-lime-300/50 bg-lime-300/[0.04]" : "border-white/10 hover:border-lime-300/40"
              }`}
            >
              {pack.featured && (
                <span className="absolute -top-3 left-7 rounded-full bg-lime-300 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-950 sm:left-10">
                  Más elegido
                </span>
              )}
              <h3 className="text-2xl font-semibold tracking-[-0.03em] text-white">{pack.name}</h3>
              <p className="mt-3 text-base leading-7 text-slate-300">{pack.videos}</p>
              <p className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-lime-300">
                <span className="align-top text-base font-semibold tracking-normal text-slate-400">desde </span>${pack.price}
              </p>
              <ul className="mt-7 space-y-3 border-t border-white/10 pt-7">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm leading-6 text-slate-400">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lime-300" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={`https://wa.me/593984966335?text=${encodeURIComponent(pack.whatsapp)}`}
                target="_blank"
                rel="noreferrer"
                className={`mt-9 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition sm:mt-auto ${
                  pack.featured
                    ? "bg-lime-300 text-slate-950 hover:bg-lime-200"
                    : "border border-white/15 text-white hover:border-lime-300/50 hover:text-lime-300"
                }`}
              >
                Cotizar por WhatsApp
              </a>
            </article>
          ))}
        </div>

        <p className="mt-8 text-sm leading-6 text-slate-500">
          Meta Ads se cotiza aparte. El presupuesto de anuncios lo defines tú.
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-500">Precios con IVA incluido.</p>
      </div>
    </section>
  );
}
