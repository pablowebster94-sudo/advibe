"use client";

import { useState } from "react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_LATIN_EAGLE_WHATSAPP || "";
const whatsappLink = (message: string) =>
  WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
    : "#contacto";

const services = [
  { number: "01", title: "Envío de dinero", desc: "Envía apoyo a tus seres queridos de forma sencilla. Consulta destinos, requisitos y tarifas.", icon: "↗" },
  { number: "02", title: "Paquetería internacional", desc: "Conectamos tus envíos con tu gente. Pregunta por rutas, tiempos y opciones disponibles.", icon: "□" },
  { number: "03", title: "Boletos de avión", desc: "Te ayudamos a encontrar opciones de viaje para que estés más cerca de casa.", icon: "✈" },
  { number: "04", title: "Pago de facturas", desc: "Resuelve pagos de servicios en un solo lugar, con atención cercana y personalizada.", icon: "＋" },
  { number: "05", title: "Recargas telefónicas", desc: "Mantente en contacto con familiares y amigos con recargas internacionales.", icon: "▤" },
  { number: "06", title: "Copias e impresiones", desc: "Servicios prácticos para tus documentos y gestiones del día a día.", icon: "▧" },
];

const faqs = [
  { q: "¿Qué servicios ofrece Latin Eagle Multiservices?", a: "Ofrecemos servicios de envío de dinero, paquetería internacional, boletos de avión, pago de facturas, recargas telefónicas y copias e impresiones. Escríbenos para confirmar los detalles de cada servicio." },
  { q: "¿Puedo enviar paquetes a Ecuador?", a: "Sí, puedes consultarnos por las opciones de paquetería a Ecuador. Las tarifas, los límites de peso, los artículos admitidos y los tiempos de entrega deben confirmarse antes de enviar." },
  { q: "¿Cómo consulto una tarifa?", a: "Envíanos un mensaje por WhatsApp indicando el servicio que necesitas y el destino. Te orientaremos sobre el precio y los pasos a seguir." },
];

export default function LatinEagleLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f5f0] text-[#172c27]">
      <div className="bg-[#143f35] px-4 py-2 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        CERCA DE CASA, AUNQUE ESTÉS LEJOS <span className="mx-2 text-[#e5b85c]">✦</span> Atención a nuestra comunidad latina
      </div>

      <header className="sticky top-0 z-40 border-b border-[#173b3215] bg-[#f7f5f0]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#inicio" className="flex items-center gap-3" aria-label="Latin Eagle Multiservices inicio">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#143f35] text-xl text-[#e5b85c]">✦</span>
            <span className="leading-tight"><span className="block text-sm font-black tracking-[0.14em]">LATIN EAGLE</span><span className="mt-1 block text-[10px] font-semibold tracking-[0.28em] text-[#6c7972]">MULTISERVICES</span></span>
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex">
            <a className="hover:text-[#b47b20]" href="#servicios">Servicios</a>
            <a className="hover:text-[#b47b20]" href="#paqueteria">Paquetería</a>
            <a className="hover:text-[#b47b20]" href="#nosotros">Nosotros</a>
            <a className="hover:text-[#b47b20]" href="#preguntas">Preguntas frecuentes</a>
          </nav>
          <a href={whatsappLink("Hola, Latin Eagle Multiservices. Quiero información sobre sus servicios.")} className="rounded-full bg-[#143f35] px-4 py-3 text-xs font-bold text-white shadow-lg shadow-[#143f35]/10 transition hover:bg-[#20594b] sm:px-5 sm:text-sm">Escríbenos <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <section id="inicio" className="relative isolate">
        <div className="absolute inset-0 -z-20 bg-[#143f35]" />
        <div className="absolute inset-0 -z-10 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 78% 25%, #dcb459 0, transparent 25%), radial-gradient(circle at 12% 88%, #5f8d73 0, transparent 30%)" }} />
        <div className="mx-auto grid min-h-[640px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.06fr_.94fr] lg:py-24">
          <div className="relative z-10 text-white">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wide text-[#f2d99a]"><span className="h-2 w-2 rounded-full bg-[#e5b85c]" /> TU CONEXIÓN CON CASA</div>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">Aquí, cada trámite se siente <span className="font-serif italic text-[#e5b85c]">más cerca.</span></h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">Envíos de dinero, paquetería, viajes y servicios cotidianos en un solo lugar. Te atendemos con cercanía, claridad y el compromiso de nuestra comunidad.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={whatsappLink("Hola, quiero consultar qué servicio necesito en Latin Eagle Multiservices.")} className="inline-flex items-center justify-center gap-3 rounded-full bg-[#e5b85c] px-7 py-4 text-sm font-extrabold text-[#19372e] shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#f1ca78]">Consulta por WhatsApp <span className="text-lg">↗</span></a>
              <a href="#servicios" className="inline-flex items-center justify-center rounded-full border border-white/30 px-7 py-4 text-sm font-bold text-white transition hover:bg-white/10">Explorar servicios</a>
            </div>
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/15 pt-6 text-xs font-semibold tracking-wide text-white/65"><span><span className="mr-2 text-[#e5b85c]">✦</span>Atención cercana</span><span><span className="mr-2 text-[#e5b85c]">✦</span>Varios servicios, un solo lugar</span><span><span className="mr-2 text-[#e5b85c]">✦</span>Para nuestra comunidad</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[2.5rem] border border-white/15" />
            <div className="relative overflow-hidden rounded-[2rem] bg-[#e9e0cb] p-4 shadow-2xl shadow-black/25 sm:p-6">
              <div className="relative min-h-[440px] overflow-hidden rounded-[1.5rem] bg-[#d1c4a7]">
                <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=85" alt="Retrato que representa a una persona de la comunidad" className="absolute inset-0 h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#102b24]/95 via-[#102b24]/10 to-transparent" />
                <div className="absolute left-5 top-5 rounded-full border border-white/30 bg-black/20 px-4 py-2 text-[10px] font-bold tracking-[0.2em] text-white backdrop-blur-md">LATIN EAGLE · LONG ISLAND</div>
                <div className="absolute bottom-0 p-6 text-white sm:p-8"><div className="mb-3 text-xs font-bold tracking-[0.25em] text-[#e5b85c]">ESTAMOS PARA AYUDARTE</div><p className="max-w-sm font-serif text-3xl leading-tight sm:text-4xl">Lo que necesitas para seguir conectado con los tuyos.</p></div>
              </div>
              <div className="flex items-center justify-between px-2 pb-1 pt-5"><div><p className="text-xs font-bold tracking-widest text-[#597167]">TU MULTISERVICIOS DE CONFIANZA</p><p className="mt-1 text-sm font-semibold">Un lugar. Muchas soluciones.</p></div><span className="grid h-12 w-12 place-items-center rounded-full bg-[#143f35] text-2xl text-[#e5b85c]">↗</span></div>
            </div>
            <div className="absolute -bottom-6 -left-5 hidden rounded-2xl bg-white p-4 shadow-xl sm:block"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e8f0e9] text-xl">♡</span><div><p className="text-sm font-extrabold">Cerca de los tuyos</p><p className="mt-1 text-xs text-[#75827c]">En cada paso del camino</p></div></div></div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#143f3518] bg-white"><div className="mx-auto grid max-w-7xl grid-cols-2 gap-5 px-5 py-7 sm:grid-cols-4 sm:px-8">{[["DINERO","Envía con tranquilidad"],["PAQUETES","Conecta con tu familia"],["VIAJES","Planea tu próximo destino"],["GESTIONES","Resuelve lo cotidiano"]].map(([label,text]) => <div key={label} className="border-l-2 border-[#e5b85c] pl-4"><p className="text-[10px] font-extrabold tracking-[0.2em] text-[#718078]">{label}</p><p className="mt-1 text-sm font-semibold sm:text-base">{text}</p></div>)}</div></section>

      <section id="servicios" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-8 md:grid-cols-[.8fr_1.2fr] md:items-end"><div><p className="text-xs font-extrabold tracking-[0.25em] text-[#a8751d]">NUESTROS SERVICIOS</p><h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">Lo que necesitas, <span className="font-serif italic text-[#a8751d]">en un solo lugar.</span></h2></div><p className="max-w-xl text-base leading-7 text-[#627168] md:justify-self-end">Queremos hacerte más fáciles las gestiones del día a día, con información clara y atención personalizada desde Long Island.</p></div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{services.map((service) => <article key={service.number} className="group rounded-[1.5rem] border border-[#dce1d9] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d4af62] hover:shadow-xl hover:shadow-[#143f35]/5 sm:p-8"><div className="flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf2ec] text-2xl text-[#143f35] transition group-hover:bg-[#143f35] group-hover:text-[#e5b85c]">{service.icon}</span><span className="text-xs font-extrabold tracking-widest text-[#aab3ac]">{service.number}</span></div><h3 className="mt-7 text-xl font-bold tracking-tight">{service.title}</h3><p className="mt-3 min-h-[76px] text-sm leading-6 text-[#6c7972]">{service.desc}</p><a href={whatsappLink(`Hola, Latin Eagle. Quiero más información sobre: ${service.title}.`)} className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#1b5143] hover:text-[#a8751d]">Consultar servicio <span>↗</span></a></article>)}</div>
      </section>

      <section id="paqueteria" className="relative overflow-hidden bg-[#e8dfcc]"><div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-[#143f35]/10" /><div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-[#143f35]/10" />
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-2 lg:items-center">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#143f35] p-8 text-white sm:p-12"><div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[#e5b85c]/10 blur-2xl" /><div className="relative"><p className="text-xs font-bold tracking-[0.24em] text-[#e5b85c]">PAQUETERÍA A ECUADOR</p><p className="mt-7 text-6xl font-semibold tracking-[-0.06em] sm:text-7xl">$28</p><p className="mt-2 text-lg font-semibold">Promoción por paquete de 8 lb</p><div className="my-7 h-px bg-white/20" /><p className="text-sm leading-6 text-white/70">Consulta con nuestro equipo la vigencia de la promoción, límites de peso, artículos admitidos y condiciones del envío.</p><a href={whatsappLink("Hola, quisiera consultar la promoción de paquetería de 8 lb por $28 para Ecuador y confirmar vigencia y condiciones.")} className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#e5b85c] px-6 py-4 text-sm font-extrabold text-[#19372e] transition hover:bg-[#f1ca78]">Consultar promoción <span>↗</span></a></div></div>
          <div><p className="text-xs font-extrabold tracking-[0.25em] text-[#a8751d]">UN PEDACITO DE CASA</p><h2 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">Tus paquetes llevan más que cosas. <span className="font-serif italic text-[#a8751d]">Llevan cariño.</span></h2><p className="mt-6 text-base leading-7 text-[#65736a]">Cuando estás lejos, cada detalle cuenta. Queremos ayudarte a mantener ese vínculo con tu familia en Ecuador con información clara en cada etapa del envío.</p><div className="mt-8 space-y-4">{["Pregunta qué artículos puedes enviar","Confirma peso, destino y precio antes de entregar","Consulta el tiempo estimado para tu envío"].map((item) => <div key={item} className="flex items-start gap-3 text-sm font-semibold"><span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#143f35] text-xs text-[#e5b85c]">✓</span>{item}</div>)}</div></div>
        </div>
      </section>

      <section id="nosotros" className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_.8fr] lg:items-center"><div><p className="text-xs font-extrabold tracking-[0.25em] text-[#a8751d]">MÁS QUE UN SERVICIO</p><h2 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">La distancia cambia. <span className="font-serif italic text-[#a8751d]">Los lazos siguen.</span></h2><p className="mt-6 max-w-2xl text-base leading-7 text-[#627168]">Latin Eagle Multiservices está para acompañarte con distintas gestiones de la vida diaria, desde envíos y viajes hasta servicios que te ayudan a mantenerte conectado con los tuyos.</p><p className="mt-4 max-w-2xl text-base leading-7 text-[#627168]">Creemos en el trato humano, la comunicación transparente y en darte orientación para que sepas qué necesitas antes de iniciar cada trámite.</p></div><div className="relative overflow-hidden rounded-[2rem] bg-[#d8c8a9] p-8 sm:p-10"><div className="absolute -right-14 -top-12 h-52 w-52 rounded-full bg-[#e5b85c]/30 blur-xl" /><div className="relative rounded-[1.5rem] border border-white/60 bg-[#f8f5ed]/80 p-7 sm:p-9"><span className="text-4xl text-[#b47b20]">“</span><p className="mt-2 font-serif text-2xl leading-snug sm:text-3xl">Nos importan las personas detrás de cada envío, cada viaje y cada gestión.</p><div className="mt-7 h-1 w-16 rounded-full bg-[#e5b85c]" /><p className="mt-5 text-xs font-extrabold tracking-[0.16em] text-[#617167]">LATIN EAGLE MULTISERVICES</p></div></div></section>

      <section id="preguntas" className="bg-white"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-extrabold tracking-[0.25em] text-[#a8751d]">¿TIENES DUDAS?</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Resolvamos tus <span className="font-serif italic text-[#a8751d]">preguntas.</span></h2><p className="mt-5 text-sm leading-6 text-[#718078]">Consulta directamente y te orientaremos sobre el servicio que necesitas.</p></div><div className="divide-y divide-[#dfe3dd]">{faqs.map((faq,index) => <div key={faq.q} className="py-5"><button className="flex w-full items-center justify-between gap-5 text-left text-base font-bold sm:text-lg" onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index}>{faq.q}<span className="text-2xl font-normal text-[#a8751d]">{openFaq === index ? "−" : "+"}</span></button>{openFaq === index && <p className="max-w-2xl pr-8 pt-4 text-sm leading-7 text-[#68766d]">{faq.a}</p>}</div>)}</div></div></section>

      <section id="contacto" className="relative overflow-hidden bg-[#143f35] px-5 py-20 text-white sm:px-8 sm:py-24"><div className="absolute -left-24 -top-24 h-80 w-80 rounded-full border border-white/10" /><div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full border border-white/10" /><div className="relative mx-auto flex max-w-5xl flex-col items-start justify-between gap-8 md:flex-row md:items-end"><div><p className="text-xs font-extrabold tracking-[0.25em] text-[#e5b85c]">ESTAMOS PARA TI</p><h2 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">¿Qué necesitas resolver hoy?</h2><p className="mt-5 max-w-xl text-base leading-7 text-white/70">Cuéntanos qué servicio buscas. Te ayudaremos a conocer las opciones y los siguientes pasos.</p></div><a href={whatsappLink("Hola Latin Eagle Multiservices, quisiera recibir información sobre sus servicios.")} className="shrink-0 rounded-full bg-[#e5b85c] px-7 py-4 text-sm font-extrabold text-[#19372e] transition hover:-translate-y-0.5 hover:bg-[#f1ca78]">Hablar con nuestro equipo ↗</a></div></section>

      <footer className="bg-[#0d2c25] px-5 py-8 text-white sm:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-lg text-[#e5b85c]">✦</span><div><p className="text-sm font-black tracking-[0.14em]">LATIN EAGLE</p><p className="mt-1 text-[10px] tracking-[0.28em] text-white/55">MULTISERVICES</p></div></div><p className="text-xs leading-5 text-white/50">© {new Date().getFullYear()} Latin Eagle Multiservices. Todos los derechos reservados.</p><a href={whatsappLink("Hola, Latin Eagle Multiservices.")} className="text-sm font-semibold text-[#e5b85c] hover:text-white">Contáctanos ↗</a></div></footer>

      {WHATSAPP_NUMBER && <a href={whatsappLink("Hola, Latin Eagle Multiservices. Quiero información sobre sus servicios.")} className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#22c55e] text-2xl text-white shadow-2xl shadow-black/20 transition hover:scale-105" aria-label="Contactar a Latin Eagle por WhatsApp"><span>◉</span></a>}
    </main>
  );
}
