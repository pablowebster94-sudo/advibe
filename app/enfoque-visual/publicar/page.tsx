import Link from "next/link";
import {Header} from "@/components/enfoque/Header";

export default function Publicar(){
  return <><Header/><main className="mx-auto max-w-6xl px-5 py-14 md:py-20">
    <section className="grid gap-10 lg:grid-cols-[1fr_520px] lg:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[.22em] text-black/40">Enfoque Visual · Publicar</p>
        <h1 className="ev-display mt-4 text-6xl font-black leading-[.9] md:text-8xl">Haz que tu propiedad o vehículo destaque.</h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-black/60">Cuéntanos qué quieres publicar. Revisamos la información, coordinamos el contenido y te explicamos el proceso de publicación y captación.</p>
      </div>
      <div className="rounded-[2rem] bg-black p-7 text-white md:p-9">
        <p className="text-xs font-black uppercase tracking-[.18em] text-[#d9ff3f]">Elige qué quieres publicar</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/enfoque-visual/contacto?tipo=propiedad" className="rounded-3xl bg-[#d9ff3f] p-6 text-black transition hover:-translate-y-1">
            <span className="text-3xl">⌂</span><h2 className="mt-6 text-2xl font-black">Propiedad</h2><p className="mt-2 text-sm text-black/60">Casa, departamento, terreno, local o alquiler.</p>
          </Link>
          <Link href="/enfoque-visual/contacto?tipo=vehiculo" className="rounded-3xl bg-white/10 p-6 transition hover:-translate-y-1">
            <span className="text-3xl">↗</span><h2 className="mt-6 text-2xl font-black">Vehículo</h2><p className="mt-2 text-sm text-white/55">Auto, SUV, camioneta o vehículo comercial.</p>
          </Link>
        </div>
        <p className="mt-7 text-sm leading-6 text-white/45">No publicamos automáticamente información sin revisión. El primer paso es registrar tu solicitud.</p>
      </div>
    </section>
  </main></>;
}
