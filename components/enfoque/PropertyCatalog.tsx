import {Header} from "@/components/enfoque/Header";
import {PropertyCard,EmptyResults} from "@/components/enfoque/Cards";
import {PropertyFiltersForm} from "@/components/enfoque/Filters";
import {BuscoCta} from "@/components/enfoque/BuscoCta";
import {Footer} from "@/components/enfoque/Footer";
import {loadProperties} from "@/lib/enfoque-catalog";
import {activeFilterCount,filterProperties,norm,options,readPropertyFilters,type SearchParams} from "@/lib/enfoque-filters";

export async function PropertyCatalog({searchParams,action,title,intro,operation}:{searchParams:SearchParams;action:string;title:string;intro:string;operation?:"venta"|"alquiler"}){
  const all=(await loadProperties()).filter(x=>!operation||x.operation===operation);
  const f=readPropertyFilters(searchParams);
  if(operation)f.operacion=operation;
  const items=filterProperties(all,f);
  const active=activeFilterCount({...f,operacion:operation?"":f.operacion});
  return <><Header/><main className="mx-auto max-w-7xl px-5 py-14">
    <p className="text-xs font-black uppercase tracking-[.2em] text-black/40">Enfoque Visual</p>
    <h1 className="ev-display mt-2 text-6xl font-black">{title}</h1>
    <p className="mt-3 max-w-2xl text-black/55">{intro}</p>
    <PropertyFiltersForm action={action} f={f} cities={options(all.map(x=>x.city))} types={options(all.map(x=>x.type))} count={items.length} total={all.length} active={active} fixedOperation={Boolean(operation)}/>
    {items.length?<div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map(x=><PropertyCard key={x.id} x={x}/>)}</div>:<EmptyResults href={action} filtered={active>0}/>}
    {items.length>0&&<BuscoCta prefill={{tipo:f.tipo?norm(f.tipo):undefined,canton:f.ciudad?norm(f.ciudad):undefined,operacion:operation||f.operacion||undefined}}/>}
  </main><Footer/></>;
}
