import type {Metadata} from "next";
import {evMetadata} from "@/lib/enfoque-seo";
import {Header} from "@/components/enfoque/Header";
import {VehicleCard,EmptyResults} from "@/components/enfoque/Cards";
import {VehicleFiltersForm} from "@/components/enfoque/Filters";
import {BuscoCta} from "@/components/enfoque/BuscoCta";
import {Footer} from "@/components/enfoque/Footer";
import {loadVehicles} from "@/lib/enfoque-catalog";
import {activeFilterCount,filterVehicles,options,readVehicleFilters} from "@/lib/enfoque-filters";
export const dynamic="force-dynamic";
export const metadata:Metadata=evMetadata({title:"Vehículos en venta",description:"Autos, SUVs y camionetas en venta en Ecuador con fotos, video y ficha técnica.",path:"/vehiculos"});
const action="/enfoque-visual/vehiculos";
export default async function Page({searchParams}:{searchParams:Promise<{[key:string]:string|string[]|undefined}>}){
  const all=await loadVehicles();
  const f=readVehicleFilters(await searchParams);
  const items=filterVehicles(all,f);
  const active=activeFilterCount(f);
  return <><Header/><main className="mx-auto max-w-7xl px-5 py-14">
    <p className="text-xs font-black uppercase tracking-[.2em] text-black/40">Enfoque Visual</p>
    <h1 className="ev-display mt-2 text-6xl font-black">Vehículos</h1>
    <p className="mt-3 max-w-2xl text-black/55">Autos, SUVs y camionetas con fotografía, video y ficha técnica.</p>
    <VehicleFiltersForm action={action} f={f} brands={options(all.map(x=>x.brand))} years={options(all.map(x=>x.year)).reverse()} fuels={options(all.map(x=>x.fuel))} transmissions={options(all.map(x=>x.transmission))} count={items.length} total={all.length} active={active}/>
    {items.length?<div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(x=><VehicleCard key={x.id} x={x}/>)}</div>:<EmptyResults href={action} filtered={active>0}/>}
    {items.length>0&&<BuscoCta prefill={{tipo:"vehiculo"}}/>}
  </main><Footer/></>;
}
