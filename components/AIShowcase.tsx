import SectionHeading from "@/components/ui/SectionHeading";
import EventButton from "@/components/EventButton";

export default function AIShowcase() {
  return (
    <section id="ia-showcase" className="relative overflow-hidden border-y border-white/6 py-20 sm:py-24 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_75%_35%,rgba(174,255,0,0.055),transparent_35%)]" />
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeading eyebrow="Tecnología aplicada" title="La inteligencia artificial debe resolver problemas reales de negocio." />

        <div className="mt-10 border border-white/10 p-7 sm:p-10">
          <p className="max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">
            Usamos inteligencia artificial para analizar campañas, organizar contenido y responder más rápido a quien escribe.
          </p>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-400 sm:text-lg">
            No añadimos tecnología por moda: solo cuando resuelve un problema real de tu negocio.
          </p>
          <EventButton href="/diagnostico" eventName="ai_showcase_cta" eventParams={{ source: "ai_showcase" }} className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-lime-300 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-lime-200 sm:w-auto">Implementar en mi marca ↗</EventButton>
        </div>
      </div>
    </section>
  );
}
