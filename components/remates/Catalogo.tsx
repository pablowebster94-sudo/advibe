import Image from "next/image";
import Link from "next/link";
import { dinero, descuento, enlaceWhatsApp, type Remate } from "@/lib/remates";

function Foto({ x }: { x: Remate }) {
  if (!x.fotos.length) return <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#ece9e3] text-black/30">
    <span className="text-3xl">◎</span><span className="text-[11px] font-bold uppercase tracking-[.16em]">Foto pronto</span>
  </div>;
  // Solo optimizamos lo que viene de Drive (host declarado en next.config.ts); cualquier otra
  // URL que el cliente pegue en la hoja se sirve sin optimizar para que nunca rompa la página.
  const src = x.fotos[0];
  const optimizable = src.startsWith("https://lh3.googleusercontent.com/");
  return <Image src={src} alt={x.nombre} fill sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
    className={"object-cover transition duration-700 group-hover:scale-105" + (x.vendido ? " grayscale" : "")}
    unoptimized={!optimizable} />;
}

function Tarjeta({ x, wa, negocio }: { x: Remate; wa: string; negocio: string }) {
  const off = descuento(x);
  return <article className="group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
    {/* Fondo neutro: si una foto de la hoja está rota, se ve un bloque sobrio y no un hueco blanco. */}
    <div className="relative aspect-[4/3] overflow-hidden bg-[#ece9e3]">
      <Foto x={x} />
      <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
        {off !== undefined && !x.vendido && <span className="rounded-full bg-[#ff3b30] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white shadow-sm">-{off}%</span>}
        {x.etiqueta && !x.vendido && <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wide shadow-sm">{x.etiqueta}</span>}
        {x.vendido && <span className="rounded-full bg-black px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white">Vendido</span>}
      </div>
      {x.fotos.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">{x.fotos.length} fotos</span>}
    </div>
    <div className="flex flex-1 flex-col p-5">
      {x.categoria && <p className="text-[11px] font-black uppercase tracking-[.16em] text-black/40">{x.categoria}</p>}
      <h3 className="mt-1 text-lg font-bold leading-snug text-black">{x.nombre}</h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        {x.precioRemate !== undefined && <span className="text-3xl font-black text-black">{dinero(x.precioRemate)}</span>}
        {x.precioAntes !== undefined && x.precioAntes !== x.precioRemate &&
          <span className="text-sm font-semibold text-black/40 line-through">{dinero(x.precioAntes)}</span>}
      </div>
      {x.descripcion && <p className="mt-3 text-sm leading-relaxed text-black/60">{x.descripcion}</p>}
      {(x.medidas || x.ubicacion) && <ul className="mt-4 flex flex-wrap gap-1.5">
        {[x.medidas, x.ubicacion].filter(Boolean).map((s) =>
          <li key={s} className="rounded-full bg-[#f5f3ee] px-2.5 py-1 text-[11px] font-bold text-black/65">{s}</li>)}
      </ul>}
      <div className="mt-auto pt-5">
        {x.vendido
          ? <p className="rounded-full bg-black/5 px-5 py-3 text-center text-sm font-bold text-black/45">Ya se vendió</p>
          : wa
            ? <a href={enlaceWhatsApp(wa, negocio, x)} target="_blank" rel="noopener"
                className="block rounded-full bg-[#25d366] px-5 py-3 text-center text-sm font-black text-black transition hover:brightness-95">
                Lo quiero por WhatsApp
              </a>
            : <p className="rounded-full bg-black/5 px-5 py-3 text-center text-sm font-bold text-black/45">Consulta en el local</p>}
      </div>
    </div>
  </article>;
}

export function Filtros({ base, cats, actual, total }: { base: string; cats: string[]; actual: string; total: number }) {
  if (!cats.length) return null;
  const chip = (activo: boolean) =>
    "rounded-full px-4 py-2 text-sm font-bold transition " + (activo ? "bg-black text-white" : "bg-white text-black/70 ring-1 ring-black/10 hover:bg-black/5");
  return <nav className="mt-8 flex flex-wrap items-center gap-2">
    <Link href={base} className={chip(actual === "todo")}>Todo <span className="opacity-50">{total}</span></Link>
    {cats.map((c) => <Link key={c} href={base + "?cat=" + encodeURIComponent(c)} className={chip(actual === c)}>{c}</Link>)}
  </nav>;
}

export function Rejilla({ items, wa, negocio }: { items: Remate[]; wa: string; negocio: string }) {
  if (!items.length) return <div className="mt-10 rounded-3xl bg-white p-10 text-center ring-1 ring-black/5">
    <p className="text-xl font-black text-black">Por ahora no hay muebles en remate.</p>
    <p className="mt-2 text-sm text-black/50">Vuelve pronto: el stock de liquidación se renueva seguido.</p>
  </div>;
  return <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
    {items.map((x) => <Tarjeta key={x.id} x={x} wa={wa} negocio={negocio} />)}
  </div>;
}

export function BotonFlotante({ wa, negocio }: { wa: string; negocio: string }) {
  if (!wa) return null;
  const msg = encodeURIComponent(`Hola ${negocio}, vi su página de remates y quiero más información.`);
  return <a href={"https://wa.me/" + wa + "?text=" + msg} target="_blank" rel="noopener"
    aria-label="Escribir por WhatsApp"
    className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-4 text-sm font-black text-black shadow-lg transition hover:brightness-95">
    Escríbenos
  </a>;
}
