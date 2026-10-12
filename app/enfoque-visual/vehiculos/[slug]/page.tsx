import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {money} from "@/lib/enfoque-data";
import {loadVehicle,loadVehicles} from "@/lib/enfoque-catalog";
import {label,similarVehicles} from "@/lib/enfoque-filters";
import {EV_SITE,breadcrumbs,evMetadata,jsonLd} from "@/lib/enfoque-seo";
import {Header} from "@/components/enfoque/Header";
import {Tracking} from "@/components/enfoque/Tracking";
import {ListingVideo} from "@/components/enfoque/Video";
import {Gallery} from "@/components/enfoque/Gallery";
import {ContactBox,MobileCta} from "@/components/enfoque/ContactBox";
import {SimilarVehicles} from "@/components/enfoque/SimilarListings";
import {Footer} from "@/components/enfoque/Footer";

export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const item=await loadVehicle((await params).slug);
  if(!item)return {title:"Vehículo no encontrado",robots:{index:false,follow:false}};
  const name=`${item.brand} ${item.model} ${item.year}`;
  const title=`${name} · ${money(item.price)}`;
  const description=(item.description||`${name} en venta, ${item.mileage.toLocaleString("es-EC")} km.`).replace(/\s+/g," ").slice(0,160);
  return evMetadata({title,description,path:"/vehiculos/"+item.slug,images:item.images});
}

export default async function Page({params}:Props){
  const {slug}=await params;
  const item=await loadVehicle(slug);
  if(!item)return notFound();
  const similar=similarVehicles(await loadVehicles(),item,3);
  const name=item.brand+" "+item.model;
  const unavailable=item.availability&&item.availability!=="disponible"?label(item.availability):undefined;
  const stats:[unknown,string][]=[[item.year,"Año"],[item.mileage.toLocaleString("es-EC")+" km","Kilometraje"],[label(item.fuel),"Combustible"],[label(item.transmission),"Transmisión"],[item.engine,"Motor"]];
  const url=`${EV_SITE}/vehiculos/${item.slug}`;
  const carLd={"@context":"https://schema.org","@type":"Car",name:`${name} ${item.year}`,url,brand:{"@type":"Brand",name:item.brand},model:item.model,vehicleModelDate:String(item.year),
    itemCondition:"https://schema.org/UsedCondition",mileageFromOdometer:{"@type":"QuantitativeValue",value:item.mileage,unitCode:"KMT"},
    ...(item.fuel?{fuelType:label(item.fuel)}:{}),...(item.transmission?{vehicleTransmission:label(item.transmission)}:{}),...(item.engine?{vehicleEngine:{"@type":"EngineSpecification",name:item.engine}}:{}),
    description:item.description,image:item.images,
    offers:{"@type":"Offer",url,price:item.price,priceCurrency:"USD",availability:unavailable?"https://schema.org/SoldOut":"https://schema.org/InStock"}};
  const crumbs=breadcrumbs([["Inicio","/"],["Vehículos","/vehiculos"],[`${name} ${item.year}`,"/vehiculos/"+item.slug]]);
  return <><Header/><Tracking id={item.id} type="vehicle" value={item.price} name={name}/>
  <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd([carLd,crumbs])}/>
  <main className="mx-auto max-w-7xl px-5 py-7 pb-24 lg:pb-7">
    <Gallery images={item.images} title={`${name} ${item.year}`} layout="vehicle"/>
    <div className="grid gap-10 py-10 lg:grid-cols-[1fr_380px]"><div>
      <p className="text-xs font-black uppercase tracking-[.2em] text-black/40">{[item.brand,String(item.year),item.city].filter(Boolean).join(" · ")}</p>
      <h1 className="ev-display mt-2 text-5xl font-black md:text-7xl">{item.model}</h1>
      <div className="mt-6 flex flex-wrap items-baseline gap-3 text-4xl font-black">{money(item.price)}{unavailable&&<span className="rounded-full bg-black px-3 py-1 text-sm text-white">{unavailable}</span>}</div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5">{stats.filter(a=>a[0]).map(a=><div key={a[1]} className="rounded-2xl bg-white p-4 ring-1 ring-black/5"><b className="block text-lg">{String(a[0])}</b><span className="text-xs text-black/45">{a[1]}</span></div>)}</div>
      {item.description&&<p className="mt-8 whitespace-pre-line text-lg leading-8 text-black/65">{item.description}</p>}
      <ListingVideo url={item.video} title={name}/>
      {item.features.length>0&&<><h2 className="mt-10 text-2xl font-black">Equipamiento</h2><ul className="mt-4 grid gap-2 sm:grid-cols-2">{item.features.map(f=><li key={f} className="rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-black/5">✓ {f}</li>)}</ul></>}
    </div>
    <ContactBox id={item.id} type="vehicle" value={item.price} city={item.city} title={`${name} ${item.year}`} unavailable={unavailable} interest="comprar_vehiculo"
      message={"Hola, estoy interesado en el "+name+" "+item.year+" de "+money(item.price)+" que vi en Enfoque Visual: "+url}/>
    </div>
    <SimilarVehicles items={similar} current={item}/>
  </main><Footer mobileCtaSpace/><MobileCta/></>;
}
