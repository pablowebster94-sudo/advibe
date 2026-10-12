import Link from "next/link";
import type {Metadata} from "next";
import {EV_SITE,evMetadata,jsonLd} from "@/lib/enfoque-seo";
import {loadProperties,loadVehicles} from "@/lib/enfoque-catalog";
import {Header} from "@/components/enfoque/Header";
import {PropertyCard,VehicleCard} from "@/components/enfoque/Cards";
import {BuscoCta} from "@/components/enfoque/BuscoCta";
import {Footer} from "@/components/enfoque/Footer";

export const dynamic="force-dynamic";
export const metadata:Metadata=evMetadata({title:"Enfoque Visual | Propiedades y vehículos en Ecuador",description:"Casas, departamentos, terrenos, alquileres y vehículos en Cuenca, Gualaceo y Azuay, con fotografía, video e información clara.",path:"/",absolute:true});
const orgLd={"@context":"https://schema.org","@type":"Organization",name:"Enfoque Visual",url:EV_SITE,logo:EV_SITE+"/opengraph-image",parentOrganization:{"@type":"Organization",name:"AdVibe Agencia",url:"https://www.advibeagencia.com"},areaServed:"EC"};

export default async function Home(){ 
  const [all,allVehicles]=await Promise.all([loadProperties(),loadVehicles()]);
  // Destacadas primero; si no hay suficientes, se completa con las más recientes.
  const pick=<T extends {featured?:boolean}>(xs:T[],n:number)=>[...xs.filter(x=>x.featured),...xs.filter(x=>!x.featured)].slice(0,n);
  const properties=pick(all,3),vehicles=pick(allVehicles,4);
  return <><Header/><script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(orgLd)}/><main>
    <section className="ev-noise bg-black px-5 py-20 text-white md:py-28"><div className="mx-auto max-w-7xl">
      <p className="text-xs font-black uppercase tracking-[.25em] text-[#d9ff3f]">ENFOQUE VISUAL · ECUADOR</p>
      <h1 className="ev-display mt-5 max-w-5xl text-6xl font-black leading-[.88] md:text-8xl">Encuentra algo que <span className="text-[#d9ff3f]">valga la pena.</span></h1>
      <p className="mt-7 max-w-xl text-lg leading-8 text-white/60">Propiedades y vehículos presentados con fotografía, video e información clara.</p>
      <div className="mt-9 flex flex-wrap gap-3"><Link href="/enfoque-visual/propiedades" className="rounded-full bg-[#d9ff3f] px-6 py-3 font-black text-black">Ver propiedades</Link><Link href="/enfoque-visual/vehiculos" className="rounded-full border border-white/20 px-6 py-3 font-bold">Ver vehículos</Link><Link href="/enfoque-visual/busco-propiedad" className="rounded-full border border-white/20 px-6 py-3 font-bold">Cuéntanos qué buscas</Link></div>
    </div></section>
    {properties.length>0&&<section className="mx-auto max-w-7xl px-5 py-16"><div className="mb-8 flex items-end justify-between"><h2 className="ev-display text-4xl font-black md:text-5xl">Propiedades destacadas</h2><Link href="/enfoque-visual/propiedades" className="text-sm font-bold underline">Ver todas</Link></div>
      <div className="grid gap-5 md:grid-cols-3">{properties.map(x=><PropertyCard key={x.id} x={x}/>)}</div>
    </section>}
    {vehicles.length>0&&<section className="bg-[#e8e5dd]"><div className="mx-auto max-w-7xl px-5 py-16"><div className="mb-8 flex items-end justify-between"><h2 className="ev-display text-4xl font-black md:text-5xl">Vehículos destacados</h2><Link href="/enfoque-visual/vehiculos" className="text-sm font-bold underline">Ver todos</Link></div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{vehicles.map(x=><VehicleCard key={x.id} x={x}/>)}</div>
    </div></section>}
    <BuscoCta variant="banner" title="¿Buscas algo que no está aquí?" text="Muchas propiedades se venden antes de publicarse. Dinos qué buscas, dónde y con qué presupuesto, y te avisamos por WhatsApp."/>
    <section id="contacto" className="bg-[#d9ff3f] px-5 py-16"><div className="mx-auto max-w-4xl text-center"><h2 className="ev-display text-5xl font-black md:text-7xl">¿Tienes algo que vender?</h2><p className="mx-auto mt-5 max-w-xl text-black/65">Enfoque Visual es una marca de AdVibe Agencia enfocada en contenido y captación digital.</p><Link href="/enfoque-visual/contacto" className="mt-8 inline-flex rounded-full bg-black px-7 py-3 font-black text-white">Quiero publicar ↗</Link></div></section>
  </main><Footer buscoCta={false}/></>;
}
