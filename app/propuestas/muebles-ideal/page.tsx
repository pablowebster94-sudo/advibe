import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Propuesta Comercial | Muebles Ideal × AdVibe",
  description: "Propuesta de contenido audiovisual, diseño gráfico y Meta Ads para Muebles Ideal.",
  alternates: { canonical: "/propuestas/muebles-ideal" },
  robots: { index: false, follow: false },
};

const plans = [
  {
    number: "PLAN 1",
    name: "Contenido Base",
    price: "$120",
    items: [
      "4 videos verticales al mes",
      "Planificación de contenido",
      "Edición y postproducción",
      "Copies y llamados a la acción",
      "Entrega y publicación del contenido",
    ],
  },
  {
    number: "PLAN 2",
    name: "Contenido + Ads",
    price: "$200",
    recommended: true,
    items: [
      "6 videos verticales al mes",
      "8 artes gráficos al mes",
      "Todo lo incluido en el Plan 1",
      "Configuración y gestión de campañas Meta Ads",
      "Segmentación y optimización",
      "Seguimiento y reporte básico",
    ],
  },
  {
    number: "PLAN 3",
    name: "Contenido Pro + Ads",
    price: "$250",
    items: [
      "8 videos verticales al mes",
      "8 artes gráficos al mes",
      "Gestión y optimización de campañas Meta Ads",
      "Mayor volumen de producción mensual",
      "Reporte de resultados más detallado",
    ],
  },
];

const pillars = [
  { number: "01", title: "Contenido que vende", text: "Videos pensados para redes sociales que muestran productos, materiales, detalles, promociones y beneficios de forma atractiva." },
  { number: "02", title: "Producción audiovisual", text: "Una estética visual profesional para elevar la percepción de los productos y mostrar el showroom y la fabricación con fidelidad." },
  { number: "03", title: "Publicidad dirigida", text: "Campañas de Meta Ads orientadas a conectar los contenidos y promociones con personas con mayor probabilidad de interés." },
  { number: "04", title: "Diseño que acompaña", text: "Piezas gráficas para promociones, productos, campañas y comunicación comercial que complementan el contenido audiovisual." },
];

export default function MueblesIdealProposalPage() {
  return (
    <main className="min-h-screen bg-[#f9f8f6] text-[#132a22] selection:bg-[#c1a162]/20">
      <section className="relative flex min-h-screen items-center overflow-hidden bg-[#132a22] px-6 py-24 text-[#f9f8f6] md:px-12">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-[#c1a162]" />
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-between gap-20">
          <div className="max-w-5xl">
            <p className="mb-10 text-xs font-medium uppercase tracking-[0.3em] text-[#c1a162]">Propuesta Comercial</p>
            <h1 className="font-serif text-5xl font-normal leading-[1.05] sm:text-6xl lg:text-8xl">
              Fortalecemos la<br />presencia digital de<br /><span className="italic text-[#c1a162]">Muebles Ideal</span>
            </h1>
            <p className="mt-10 max-w-3xl text-lg font-light leading-relaxed text-white/65 sm:text-xl lg:text-2xl">
              Transformamos la trayectoria, calidad y experiencia de Muebles Ideal en contenido que conecta con nuevas generaciones y convierte la atención en oportunidades de venta.
            </p>
          </div>
          <div>
            <p className="font-serif text-2xl sm:text-3xl">AdVibe Agencia <span className="mx-3 text-[#c1a162]">×</span> Muebles Ideal</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.25em] text-white/40">Gualaceo, Azuay — 2026</p>
          </div>
        </div>
        <div className="absolute bottom-16 right-12 hidden h-px w-20 bg-[#c1a162]/50 md:block" />
      </section>

      <section className="px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto grid max-w-6xl gap-20 lg:grid-cols-2 lg:items-center lg:gap-28">
          <div>
            <h2 className="font-serif text-4xl font-normal leading-[1.08] sm:text-5xl lg:text-6xl">Una marca con historia.<br /><span className="italic">Una oportunidad para mostrarla mejor.</span></h2>
            <div className="mt-10 space-y-6 text-lg font-light leading-relaxed text-slate-600">
              <p>Muebles Ideal cuenta con más de 50 años de experiencia en la fabricación de muebles y una presencia comercial consolidada.</p>
              <p>Hoy, el reto no es comenzar desde cero.</p>
              <p className="border-l-2 border-[#132a22] pl-5 font-medium text-[#132a22]">Es llevar todo ese valor a las plataformas digitales de una manera más atractiva, actual y estratégica.</p>
            </div>
          </div>
          <div className="space-y-8">
            {[
              ["50+ años", "Experiencia y trayectoria"],
              ["Fabricación propia", "Conocimiento y control sobre el producto"],
              ["Catálogo amplio", "Salas, dormitorios, comedores y mobiliario"],
              ["Presencia digital", "Una comunidad y canales que ya generan actividad comercial"],
            ].map(([title, text]) => (
              <div key={title} className="border-l-2 border-[#c1a162] pl-6">
                <p className="font-serif text-3xl">{title}</p>
                <p className="mt-1 text-sm font-light text-slate-500 sm:text-base">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mx-auto mt-20 max-w-6xl bg-[#132a22] p-10 text-[#f9f8f6] sm:p-14 lg:p-16">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-[#c1a162]">La oportunidad</p>
          <p className="font-serif text-2xl leading-snug sm:text-4xl">Mostrar no solamente el mueble, sino lo que ese mueble representa: <span className="italic text-[#c1a162]">calidad, diseño, comodidad y un espacio para vivir.</span></p>
        </div>
      </section>

      <section className="px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-20 text-center md:mb-28">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c1a162]">Metodología</p>
            <h2 className="mt-4 font-serif text-5xl font-normal sm:text-6xl">Nuestro enfoque de trabajo</h2>
            <div className="mx-auto mt-8 h-px w-16 bg-[#c1a162]" />
          </div>
          <div className="grid gap-x-16 gap-y-16 md:grid-cols-2 lg:gap-x-24 lg:gap-y-20">
            {pillars.map((pillar) => (
              <div key={pillar.number} className="relative pl-0 pt-6">
                <span className="absolute -top-4 left-0 font-serif text-7xl text-[#c1a162]/15">{pillar.number}</span>
                <h3 className="relative font-serif text-2xl sm:text-3xl">{pillar.title}</h3>
                <p className="relative mt-4 max-w-xl text-base font-light leading-relaxed text-slate-600">{pillar.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center md:mb-20">
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">Una propuesta adaptable al ritmo de Muebles Ideal</h2>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Valores mensuales · No incluyen IVA</p>
          </div>
          <div className="grid items-stretch gap-6 lg:grid-cols-3 lg:gap-8">
            {plans.map((plan) => (
              <article key={plan.number} className={`relative flex flex-col p-8 ${plan.recommended ? "border-2 border-[#132a22] bg-[#132a22] text-white shadow-2xl lg:-translate-y-4" : "border border-slate-200 bg-[#f9f8f6]"}`}>
                {plan.recommended && <span className="absolute right-0 top-0 bg-[#c1a162] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white">Recomendado</span>}
                <p className={`text-xs font-bold uppercase tracking-[0.18em] ${plan.recommended ? "text-white/60" : "text-slate-500"}`}>{plan.number}</p>
                <h3 className={`mt-3 font-serif text-3xl ${plan.recommended ? "text-white" : "text-[#132a22]"}`}>{plan.name}</h3>
                <div className={`mt-7 mb-8 font-serif text-5xl ${plan.recommended ? "text-white" : "text-[#132a22]"}`}>{plan.price} <span className={`font-sans text-base font-light ${plan.recommended ? "text-white/50" : "text-slate-400"}`}>/ mes</span></div>
                <ul className={`space-y-4 text-sm leading-relaxed ${plan.recommended ? "text-white/80" : "text-slate-700"}`}>
                  {plan.items.map((item) => <li key={item} className="flex gap-3"><span className="mt-1 text-[#c1a162]">•</span><span>{item}</span></li>)}
                </ul>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-10 max-w-4xl border border-slate-200 border-l-4 border-l-[#c1a162] bg-slate-50 p-7 text-center">
            <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-[#132a22]">Inversión Publicitaria</h4>
            <p className="mt-3 text-sm font-light leading-relaxed text-slate-600">La gestión de campañas Meta Ads está incluida en los planes correspondientes. El presupuesto destinado a publicidad se mantiene independiente y es cubierto directamente por Muebles Ideal mediante su propia tarjeta de crédito o débito.</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-24 md:px-12 md:py-32">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <h2 className="font-serif text-5xl leading-tight sm:text-6xl">¿Qué queremos conseguir?</h2>
            <p className="mt-10 border-l-4 border-[#132a22] pl-6 text-xl font-light leading-relaxed text-slate-600 sm:text-2xl">“Que Muebles Ideal no solamente publique productos, sino que construya una presencia digital capaz de transmitir la calidad de sus muebles antes de que el cliente llegue al showroom.”</p>
          </div>
          <div className="mt-24 grid gap-10 md:grid-cols-3">
            {[
              ["Mayor percepción de valor", "Contenido audiovisual que comunique calidad y diseño."],
              ["Mayor alcance", "Contenido preparado para generar descubrimiento e interacción."],
              ["Más oportunidades", "Campañas orientadas a conectar los productos con potenciales compradores."],
            ].map(([title, text]) => <div key={title} className="border-t border-[#c1a162] pt-6"><h3 className="font-serif text-2xl sm:text-3xl">{title}</h3><p className="mt-4 text-base font-light leading-relaxed text-slate-600">{text}</p></div>)}
          </div>
          <div className="mt-20 bg-[#132a22] p-10 text-center text-[#f9f8f6] sm:p-16 lg:p-20">
            <p className="font-serif text-3xl leading-tight sm:text-5xl">Contenido que muestra.<br /><span className="italic text-[#c1a162]">Publicidad que conecta.</span><br />Una marca con 50 años que sigue evolucionando.</p>
          </div>
          <div className="mt-12 border-t border-slate-200 pt-8">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Condiciones del servicio</h4>
            <div className="mt-6 grid gap-4 text-sm font-light leading-relaxed text-slate-500 md:grid-cols-2 lg:grid-cols-3">
              <p>• Forma de pago: 50% al inicio del periodo de trabajo y 50% al finalizar el periodo mensual.</p>
              <p>• La jornada de producción se coordina previamente con Muebles Ideal.</p>
              <p>• El contenido se desarrollará de acuerdo con los productos, promociones y objetivos comerciales definidos para cada mes.</p>
              <p>• Los resultados dependen de la estrategia, constancia de publicación, inversión publicitaria y otros factores.</p>
              <p className="font-medium text-[#132a22]">• Los valores de los planes no incluyen IVA.</p>
              <p className="font-medium text-[#132a22]">• La inversión publicitaria de Meta Ads no está incluida en los valores de los planes.</p>
            </div>
          </div>
          <footer className="mt-12 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <span>AdVibe Agencia</span>
            <a href="https://wa.me/593984966335?text=Hola%2C%20quiero%20conocer%20la%20propuesta%20para%20Muebles%20Ideal." target="_blank" rel="noreferrer" className="text-[#132a22] transition hover:text-[#c1a162]">WhatsApp / Contacto</a>
          </footer>
        </div>
      </section>
    </main>
  );
}
