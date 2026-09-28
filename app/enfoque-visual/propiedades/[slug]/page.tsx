import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {money} from "@/lib/enfoque-data";
import {loadProperty} from "@/lib/enfoque-catalog";
import {label} from "@/lib/enfoque-filters";
import {EV_SITE,breadcrumbs,evMetadata,jsonLd} from "@/lib/enfoque-seo";
import {Header} from "@/components/enfoque/Header";
import {Tracking} from "@/components/enfoque/Tracking";
import {ListingVideo} from "@/components/enfoque/Video";
import {Gallery} from "@/components/enfoque/Gallery";
import {ContactBox,MobileCta} from "@/components/enfoque/ContactBox";

export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const item=await loadProperty((await params).slug);
  if(!item)return {title:"Propiedad no encontrada",robots:{index:false,follow:false}};
  const title=`${item.title} · ${money(item.price)}${item.operation==="alquiler"?"/mes":""}`;
  const description=(item.description||`${label(item.type)} en ${label(item.operation).toLowerCase()} en ${item.city}.`).replace(/\s+/g," ").slice(0,160);
  return evMetadata({title,description,path:"/propiedades/"+item.slug,images:item.images});
}

export default async function Page({params}:Props){
  const {slug}=await params;
  const item=await loadProperty(slug);
  if(!item)return notFound();
  const unavailable=item.availability&&item.availability!=="disponible"?label(item.availability):undefined;
  const stats:[unknown,string][]=[[item.buildM2,"m² construcción"],[item.landM2,"m² terreno"],[item.rooms,"dormitorios"],[item.baths,"baños"],[item.parking,"parqueaderos"]];
  const url=`${EV_SITE}/propiedades/${item.slug}`;
  const listingLd={"@context":"https://schema.org","@type":"RealEstateListing",name:item.title,description:item.description,url,image:item.images,
    about:{"@type":item.type==="departamento"?"Apartment":item.type==="casa"?"SingleFamilyResidence":"Place",name:item.title,
      address:{"@type":"PostalAddress",addressLocality:item.city,addressRegion:"Azuay",addressCountry:"EC",streetAddress:item.sector||undefined},
      ...(item.rooms?{numberOfRooms:item.rooms}:{}),...(item.buildM2||item.landM2?{floorSize:{"@type":"QuantitativeValue",value:item.buildM2||item.landM2,unitCode:"MTK"}}:{})},
    offers:{"@type":"Offer",url,price:item.price,priceCurrency:"USD",businessFunction:item.operation==="alquiler"?"http://purl.org/goodrelations/v1#LeaseOut":"http://purl.org/goodrelations/v1#Sell",
      availability:unavailable?"https://schema.org/SoldOut":"https://schema.org/InStock"}};
  const crumbs=breadcrumbs([["Inicio","/"],[item.operation==="alquiler"?"Alquiler":"Propiedades",item.operation==="alquiler"?"/alquiler":"/propiedades"],[item.title,"/propiedades/"+item.slug]]);
  return <><Header/><Tracking id={item.id} type="property" value={item.price} name={item.title}/>
  <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd([listingLd,crumbs])}/>
  <main className="mx-auto max-w-7xl px-5 py-7 pb-24 lg:pb-7">
    <Gallery images={item.images} title={item.title}/>
    <div className="grid gap-10 py-10 lg:grid-cols-[1fr_380px]"><div>
      <p className="text-xs font-black uppercase tracking-[.2em] text-black/40">{[label(item.operation),label(item.type),item.city,item.sector].filter(Boolean).join(" · ")}</p>
      <h1 className="ev-display mt-2 text-5xl font-black leading-none md:text-7xl">{item.title}</h1>
      <div className="mt-6 flex flex-wrap items-baseline gap-3 text-4xl font-black">{money(item.price)}{item.operation==="alquiler"&&<span className="text-base font-medium text-black/45">/ mes</span>}{unavailable&&<span className="rounded-full bg-black px-3 py-1 text-sm text-white">{unavailable}</span>}</div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">{stats.filter(a=>a[0]).map(a=><div key={a[1]} className="rounded-2xl bg-white p-4 ring-1 ring-black/5"><b className="block text-xl">{String(a[0])}</b><span className="text-xs text-black/45">{a[1]}</span></div>)}</div>
      {item.description&&<p className="mt-8 whitespace-pre-line text-lg leading-8 text-black/65">{item.description}</p>}
      <ListingVideo url={item.video} title={item.title}/>
      {item.features.length>0&&<><h2 className="mt-10 text-2xl font-black">Características</h2><ul className="mt-4 grid gap-2 sm:grid-cols-2">{item.features.map(f=><li key={f} className="rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-black/5">✓ {f}</li>)}</ul></>}
    </div>
    <ContactBox id={item.id} type="property" value={item.price} city={item.city} title={item.title} unavailable={unavailable}
      interest={item.operation==="alquiler"?"alquilar_propiedad":"comprar_propiedad"}
      message={"Hola, estoy interesado en "+item.title+" de "+money(item.price)+(item.operation==="alquiler"?" al mes":"")+" que vi en Enfoque Visual: "+url}/>
    </div>
  </main><MobileCta/></>;
}
