import type {Metadata} from "next";
import Image from "next/image";
import {money} from "@/lib/enfoque-data";
import {evMetadata} from "@/lib/enfoque-seo";
import {OPORTUNIDADES,OPORTUNIDADES_WHATSAPP} from "@/lib/enfoque-oportunidades";
import {Header} from "@/components/enfoque/Header";
import {OportunidadCta} from "@/components/enfoque/OportunidadCta";
import {OportunidadView} from "@/components/enfoque/OportunidadView";

export const metadata:Metadata=evMetadata({title:"Oportunidades en venta en Azuay",description:"Casas en Gualaceo y Sígsig, línea de bus y autos de AM Motorsport: precios, fotos y datos completos.",path:"/oportunidades"});

const KIND={propiedad:"Propiedad",vehiculo:"Vehículo",negocio:"Negocio"} as const;

export default function Page(){
  const number=(OPORTUNIDADES_WHATSAPP||process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||"").replace(/\D/g,"");
  return <><Header/><OportunidadView items={OPORTUNIDADES.map(({id,title,price})=>({id,title,price}))}/><main>
    <section className="bg-black px-5 py-12 text-white md:py-16"><div className="mx-auto max-w-7xl">
      <p className="text-xs font-black uppercase tracking-[.25em] text-[#d9ff3f]">Enfoque Visual · Oportunidades</p>
      <h1 className="ev-display mt-4 text-5xl font-black leading-[.9] md:text-7xl">En venta ahora <span className="text-[#d9ff3f]">en Azuay.</span></h1>
      <p className="mt-5 max-w-xl text-lg leading-8 text-white/60">Precio, ubicación y datos completos de cada oportunidad. Si una te interesa, escríbenos y coordinamos la visita.</p>
      <nav aria-label="Oportunidades" className="-mx-5 mt-7 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">{OPORTUNIDADES.map(o=><a key={o.id} href={"#"+o.id} className="shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm font-bold ring-1 ring-white/15 hover:bg-white/20">{o.title}</a>)}</nav>
    </div></section>
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-10">
      {OPORTUNIDADES.map(o=><article key={o.id} id={o.id} className="ev-card grid scroll-mt-24 md:grid-cols-[1.1fr_1fr]">
        <div className="relative aspect-[4/3] bg-[#e8e5dd] md:aspect-auto md:min-h-[360px]">
          {o.images.length?<div className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto">{o.images.map((src,i)=><div key={src} className="relative h-full w-full shrink-0 snap-center"><Image src={src} alt={`${o.title} · foto ${i+1}`} fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover" priority={i===0&&o===OPORTUNIDADES[0]}/></div>)}</div>:<div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-3 bg-black p-8 text-center text-white"><span className="text-5xl" aria-hidden="true">{o.kind==="negocio"?"🚌":"📷"}</span><span className="ev-display text-3xl font-black text-[#d9ff3f]">{o.title}</span><span className="text-sm text-white/55">{o.kind==="negocio"?o.place:"Pide las fotos por WhatsApp"}</span></div>}
          {o.images.length>1&&<span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-white">{o.images.length} fotos · desliza →</span>}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-black uppercase tracking-wide">{KIND[o.kind]}</span>
        </div>
        <div className="flex flex-col p-6 md:p-8">
          <p className="text-xs font-black uppercase tracking-[.16em] text-black/40">{o.place}</p>
          <h2 className="mt-1 text-3xl font-black leading-tight">{o.title}</h2>
          <p className="mt-2 text-4xl font-black">{money(o.price)}</p>
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">{o.specs.map(s=><li key={s} className="rounded-xl bg-[#f5f3ee] px-3 py-2 text-sm font-bold text-black/70">✓ {s}</li>)}</ul>
          <p className="mt-5 text-sm leading-6 text-black/60">{o.description}</p>
          <p className="mt-3 text-xs font-bold text-black/40">{o.seller}</p>
          <div className="mt-auto pt-6"><OportunidadCta id={o.id} title={o.title} price={o.price} number={(o.whatsapp||number).replace(/\D/g,"")}/></div>
        </div>
      </article>)}
    </div>
  </main></>;
}
