import type {Metadata} from "next";
import {Header} from "@/components/enfoque/Header";
import {WhatsApp} from "@/components/enfoque/WhatsApp";
import {BuscoForm} from "@/components/enfoque/BuscoForm";
import {norm} from "@/lib/enfoque-filters";
import {evMetadata} from "@/lib/enfoque-seo";

export const metadata:Metadata=evMetadata({title:"¿Buscas casa, terreno o vehículo? Te avisamos",description:"Dinos qué buscas en Gualaceo, Paute, Chordeleg, Sígsig, Cuenca o Azogues y te escribimos por WhatsApp cuando tengamos opciones. También si compras desde el exterior.",path:"/busco-propiedad"});

type SP={[key:string]:string|string[]|undefined};
const one=(v:string|string[]|undefined)=>norm(Array.isArray(v)?v[0]:v).replace(/\s+/g,"_");

// Prellenado desde las fichas y listados: ?tipo=casa&canton=gualaceo&operacion=alquilar
export default async function BuscoPropiedad({searchParams}:{searchParams:Promise<SP>}){
  const sp=await searchParams;
  const operation=one(sp.operacion);
  const initial={what:one(sp.tipo),canton:one(sp.canton),operation:operation==="alquiler"?"alquilar":operation==="venta"?"comprar":operation};
  return <><Header/><main className="mx-auto max-w-6xl px-5 py-14 md:py-20"><div className="grid gap-12 lg:grid-cols-[1fr_560px] lg:items-start">
    <section>
      <p className="text-xs font-black uppercase tracking-[.22em] text-black/40">Enfoque Visual · Busco propiedad</p>
      <h1 className="ev-display mt-4 text-6xl font-black leading-[.9] md:text-8xl">¿No encuentras lo que buscas?</h1>
      <p className="mt-7 max-w-xl text-lg leading-8 text-black/60">Muchas propiedades y vehículos se venden antes de publicarse. Dinos qué buscas, en qué cantón y con qué presupuesto, y te escribimos por WhatsApp cuando tengamos algo que encaje.</p>
      <ul className="mt-8 space-y-3 text-sm font-bold">
        <li className="rounded-2xl bg-white p-4 ring-1 ring-black/5">✓ Casas, terrenos, locales, departamentos y vehículos</li>
        <li className="rounded-2xl bg-white p-4 ring-1 ring-black/5">✓ Gualaceo, Paute, Chordeleg, Sígsig, Cuenca y Azogues</li>
        <li className="rounded-2xl bg-white p-4 ring-1 ring-black/5">✓ ¿Compras desde el exterior? También te ayudamos</li>
      </ul>
      <div className="mt-8 max-w-xs"><WhatsApp type="general" ctaSource="busco_propiedad" message="Hola, estoy buscando una propiedad o vehículo y quiero que me avisen de opciones."/></div>
    </section>
    <BuscoForm initial={initial}/></div></main></>;
}
