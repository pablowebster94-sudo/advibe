import Link from "next/link";
import type {Metadata} from "next";
import {EV_SITE,evMetadata,jsonLd} from "@/lib/enfoque-seo";
import {loadProperties,loadVehicles} from "@/lib/enfoque-catalog";
import {money,type Property,type Vehicle} from "@/lib/enfoque-data";
import {label,norm,options} from "@/lib/enfoque-filters";
import {Header} from "@/components/enfoque/Header";
import {PropertyCard,VehicleCard} from "@/components/enfoque/Cards";
import {ListingImage} from "@/components/enfoque/ListingImage";

export const dynamic="force-dynamic";
export const metadata:Metadata=evMetadata({title:"Enfoque Visual | Propiedades y vehículos en Ecuador",description:"Casas, departamentos, terrenos, alquileres y vehículos en Cuenca, Gualaceo y Azuay, con fotografía, video e información clara.",path:"/",absolute:true});
const orgLd={"@context":"https://schema.org","@type":"Organization",name:"Enfoque Visual",url:EV_SITE,logo:EV_SITE+"/opengraph-image",parentOrganization:{"@type":"Organization",name:"AdVibe Agencia",url:"https://www.advibeagencia.com"},areaServed:"EC"};

// Destacadas primero; si no hay suficientes, se completa con las más recientes.
const pick=<T extends {featured?:boolean}>(xs:T[],n:number)=>[...xs.filter(x=>x.featured),...xs.filter(x=>!x.featured)].slice(0,n);

type Spot={href:string;image:string;kicker:string;title:string;price:string;meta:string};
// Publicación del hero: la primera destacada con foto. Sale de la grilla para no repetirse.
function spotlight(ps:Property[],vs:Vehicle[]):{spot?:Spot;propertyId?:string;vehicleId?:string}{
  const p=pick(ps.filter(x=>x.images[0]),1)[0];
  if(p)return {propertyId:p.id,spot:{href:"/enfoque-visual/propiedades/"+p.slug,image:p.images[0],kicker:label(p.operation)+" · "+label(p.type),title:p.title,price:money(p.price)+(p.operation==="alquiler"?"/mes":""),meta:[p.city,p.sector].filter(Boolean).join(" · ")}};
  const v=pick(vs.filter(x=>x.images[0]),1)[0];
  if(v)return {vehicleId:v.id,spot:{href:"/enfoque-visual/vehiculos/"+v.slug,image:v.images[0],kicker:"Vehículo · "+v.year,title:v.brand+" "+v.model,price:money(v.price),meta:v.mileage.toLocaleString("es-EC")+" km · "+label(v.transmission)}};
  return {};
}

const field="w-full rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-black outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[#d9ff3f]";

export default async function Home(){
  const [all,allVehicles]=await Promise.all([loadProperties(),loadVehicles()]);
  const {spot,propertyId,vehicleId}=spotlight(all,allVehicles);
  const properties=pick(all.filter(x=>x.id!==propertyId),3),vehicles=pick(allVehicles.filter(x=>x.id!==vehicleId),3);
  const count=(f:(x:Property)=>boolean)=>all.filter(f).length;
  const categories=[
    {href:"/enfoque-visual/propiedades?operacion=venta&tipo=casa",title:"Casas",n:count(x=>x.operation==="venta"&&norm(x.type)==="casa"),icon:"⌂"},
    {href:"/enfoque-visual/propiedades?operacion=venta&tipo=departamento",title:"Departamentos",n:count(x=>x.operation==="venta"&&norm(x.type)==="departamento"),icon:"▦"},
    {href:"/enfoque-visual/propiedades?tipo=terreno",title:"Terrenos",n:count(x=>norm(x.type)==="terreno"),icon:"◫"},
    {href:"/enfoque-visual/alquiler",title:"Alquiler",n:count(x=>x.operation==="alquiler"),icon:"⚿"},
    {href:"/enfoque-visual/vehiculos",title:"Vehículos",n:allVehicles.length,icon:"◉"},
  ];
  return <><Header/><script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(orgLd)}/><main>
    <section className="overflow-hidden bg-black text-white"><div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 md:py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
      <div>
        <p className="text-xs font-black uppercase tracking-[.25em] text-[#d9ff3f]">Cuenca · Gualaceo · Azuay</p>
        <h1 className="ev-display mt-5 text-5xl font-black leading-[.9] sm:text-6xl md:text-7xl">Encuentra algo que <span className="text-[#d9ff3f]">valga la pena.</span></h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-white/60">Casas, departamentos, terrenos y vehículos con fotografía real, video e información clara. Escríbenos y te respondemos por WhatsApp.</p>
        <form action="/enfoque-visual/propiedades" method="get" role="search" className="mt-8 grid gap-2 rounded-[1.75rem] bg-white/10 p-2 ring-1 ring-white/15 sm:grid-cols-[1.4fr_1fr_auto]">
          <label className="sr-only" htmlFor="ev-q">Qué buscas</label>
          <input id="ev-q" name="q" placeholder="Sector, tipo o palabra clave" className={field}/>
          <label className="sr-only" htmlFor="ev-op">Operación</label>
          <select id="ev-op" name="operacion" defaultValue="" className={field}><option value="">Venta y alquiler</option><option value="venta">Comprar</option><option value="alquiler">Alquilar</option></select>
          <button className="rounded-2xl bg-[#d9ff3f] px-6 py-3.5 font-black text-black transition hover:scale-[1.02]">Buscar</button>
        </form>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-white/55">
          <Link href="/enfoque-visual/propiedades" className="hover:text-white">Ver propiedades →</Link>
          <Link href="/enfoque-visual/vehiculos" className="hover:text-white">Ver vehículos →</Link>
          {options(all.map(x=>x.city)).slice(0,3).map(c=><Link key={c} href={"/enfoque-visual/propiedades?ciudad="+encodeURIComponent(c)} className="hover:text-white">En {c}</Link>)}
        </div>
      </div>
      {spot?<Link href={spot.href} className="group relative block aspect-[5/6] overflow-hidden rounded-[2rem] ring-1 ring-white/10 sm:aspect-[4/3] lg:aspect-[4/5]">
        <ListingImage src={spot.image} alt={spot.title} priority sizes="(min-width:1024px) 45vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"/>
        <span className="absolute left-4 top-4 rounded-full bg-[#d9ff3f] px-3 py-1 text-[11px] font-black uppercase tracking-wide text-black">Destacado</span>
        <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
          <p className="text-[11px] font-black uppercase tracking-[.18em] text-white/60">{spot.kicker}</p>
          <p className="mt-1 text-3xl font-black md:text-4xl">{spot.price}</p>
          <p className="mt-1 text-lg font-bold">{spot.title}</p>
          <div className="mt-3 flex items-center justify-between gap-3 text-sm"><span className="text-white/60">{spot.meta}</span><span className="shrink-0 rounded-full bg-white px-4 py-2 font-black text-black transition group-hover:bg-[#d9ff3f]">Ver ficha →</span></div>
        </div>
      </Link>:<div className="hidden rounded-[2rem] bg-white/5 p-10 ring-1 ring-white/10 lg:block"><p className="ev-display text-5xl font-black leading-[.95]">Fotografía.<br/>Video.<br/><span className="text-[#d9ff3f]">Información clara.</span></p></div>}
    </div></section>

    <section className="border-b border-black/10 bg-[#f5f3ee]"><div className="mx-auto max-w-7xl px-5 py-6">
      <nav aria-label="Categorías" className="-mx-5 flex snap-x scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
        {categories.map(c=><Link key={c.title} href={c.href} className="group flex min-w-[11.5rem] snap-start items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:ring-black/20">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-lg text-[#d9ff3f]">{c.icon}</span>
          <span><span className="block font-black leading-tight">{c.title}</span><span className="block text-xs font-bold text-black/45">{c.n>0?c.n+(c.n===1?" publicación":" publicaciones"):"Ver"}</span></span>
        </Link>)}
      </nav>
    </div></section>

    {properties.length>0&&<section className="mx-auto max-w-7xl px-5 py-16"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-black/40">Propiedades</p><h2 className="ev-display mt-2 text-4xl font-black md:text-5xl">Destacadas para ti</h2></div><Link href="/enfoque-visual/propiedades" className="shrink-0 rounded-full border border-black/15 px-5 py-2.5 text-sm font-bold hover:bg-black hover:text-white">Ver todas</Link></div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{properties.map(x=><PropertyCard key={x.id} x={x}/>)}</div>
    </section>}
    {vehicles.length>0&&<section className="bg-[#e8e5dd]"><div className="mx-auto max-w-7xl px-5 py-16"><div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-black/40">Vehículos</p><h2 className="ev-display mt-2 text-4xl font-black md:text-5xl">Listos para rodar</h2></div><Link href="/enfoque-visual/vehiculos" className="shrink-0 rounded-full border border-black/15 px-5 py-2.5 text-sm font-bold hover:bg-black hover:text-white">Ver todos</Link></div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{vehicles.map(x=><VehicleCard key={x.id} x={x}/>)}</div>
    </div></section>}

    <section className="mx-auto max-w-7xl px-5 py-16"><div className="grid gap-4 md:grid-cols-3">
      {[["01","Fotos y video reales","Cada publicación se presenta con fotografía y, cuando aplica, video del lugar o del vehículo."],["02","Ficha clara","Precio, ubicación, medidas o ficha técnica a la vista, sin rodeos."],["03","Respuesta directa","Escríbenos por WhatsApp o deja tus datos y te contactamos."]].map(([n,t,d])=><div key={n} className="rounded-3xl bg-white p-7 ring-1 ring-black/5"><p className="text-sm font-black text-black/30">{n}</p><h3 className="mt-6 text-2xl font-black">{t}</h3><p className="mt-2 text-sm leading-6 text-black/55">{d}</p></div>)}
    </div></section>

    <section id="contacto" className="bg-[#d9ff3f] px-5 py-16"><div className="mx-auto max-w-4xl text-center"><h2 className="ev-display text-5xl font-black md:text-7xl">¿Tienes algo que vender?</h2><p className="mx-auto mt-5 max-w-xl text-black/65">Fotografiamos, grabamos y publicamos tu propiedad o vehículo, y lo movemos con campañas de captación. Enfoque Visual es una marca de AdVibe Agencia.</p><Link href="/enfoque-visual/publicar" className="mt-8 inline-flex rounded-full bg-black px-7 py-3 font-black text-white">Quiero publicar ↗</Link></div></section>
  </main></>;
}
