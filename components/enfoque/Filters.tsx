import Link from "next/link";
import {label,type PropertyFilters,type VehicleFilters} from "@/lib/enfoque-filters";

// Formulario GET sin JavaScript: los filtros quedan en la URL.
const field="w-full rounded-xl bg-white px-3 py-3 text-sm ring-1 ring-black/10 outline-none focus:ring-black";
const lbl="block text-[11px] font-black uppercase tracking-[.14em] text-black/45";

function Select({name,title,value,values,any="Todos"}:{name:string;title:string;value:string;values:string[];any?:string}){
  return <label className={lbl}>{title}<select name={name} defaultValue={value} className={field+" mt-1 font-bold normal-case tracking-normal text-black"}>
    <option value="">{any}</option>{values.map(v=><option key={v} value={v}>{label(v)}</option>)}
  </select></label>;
}
function Num({name,title,value,placeholder}:{name:string;title:string;value?:number;placeholder:string}){
  return <label className={lbl}>{title}<input name={name} type="number" min={0} inputMode="numeric" defaultValue={value??""} placeholder={placeholder} className={field+" mt-1 font-bold normal-case tracking-normal text-black"}/></label>;
}
function SortSelect({value}:{value:string}){
  return <label className={lbl}>Ordenar<select name="orden" defaultValue={value} className={field+" mt-1 font-bold normal-case tracking-normal text-black"}>
    <option value="recientes">Recientes</option><option value="precio_asc">Menor precio</option><option value="precio_desc">Mayor precio</option>
  </select></label>;
}
function Shell({action,count,total,active,children}:{action:string;count:number;total:number;active:number;children:React.ReactNode}){
  return <form action={action} method="get" className="mt-8 rounded-3xl bg-[#e8e5dd] p-4 md:p-5" role="search">
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-9">{children}</div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm font-bold text-black/55" aria-live="polite">{count} de {total} resultados</p>
      <div className="flex gap-2">{active>0&&<Link href={action} className="rounded-full px-5 py-3 text-sm font-bold underline">Limpiar</Link>}<button className="rounded-full bg-black px-6 py-3 text-sm font-black text-white">Filtrar</button></div>
    </div>
  </form>;
}

export function PropertyFiltersForm({action,f,cities,types,count,total,active,fixedOperation}:{action:string;f:PropertyFilters;cities:string[];types:string[];count:number;total:number;active:number;fixedOperation?:boolean}){
  return <Shell action={action} count={count} total={total} active={active}>
    <label className={lbl+" col-span-2"}>Buscar<input name="q" defaultValue={f.q} placeholder="Sector, palabra clave…" className={field+" mt-1 font-bold normal-case tracking-normal text-black"}/></label>
    {!fixedOperation&&<Select name="operacion" title="Operación" value={f.operacion} values={["venta","alquiler"]} any="Todas"/>}
    <Select name="ciudad" title="Ciudad" value={f.ciudad} values={cities} any="Todas"/>
    <Select name="tipo" title="Tipo" value={f.tipo} values={types}/>
    <Num name="min" title="Precio mín." value={f.min} placeholder="$"/>
    <Num name="max" title="Precio máx." value={f.max} placeholder="$"/>
    <label className={lbl}>Habitaciones<select name="habitaciones" defaultValue={f.habitaciones??""} className={field+" mt-1 font-bold normal-case tracking-normal text-black"}><option value="">Cualquiera</option>{[1,2,3,4].map(n=><option key={n} value={n}>{n}+</option>)}</select></label>
    <SortSelect value={f.orden}/>
  </Shell>;
}

export function VehicleFiltersForm({action,f,brands,years,fuels,transmissions,count,total,active}:{action:string;f:VehicleFilters;brands:string[];years:string[];fuels:string[];transmissions:string[];count:number;total:number;active:number}){
  return <Shell action={action} count={count} total={total} active={active}>
    <label className={lbl+" col-span-2"}>Buscar<input name="q" defaultValue={f.q} placeholder="Modelo, equipamiento…" className={field+" mt-1 font-bold normal-case tracking-normal text-black"}/></label>
    <Select name="marca" title="Marca" value={f.marca} values={brands} any="Todas"/>
    <label className={lbl}>Año desde<select name="desde" defaultValue={f.desde??""} className={field+" mt-1 font-bold normal-case tracking-normal text-black"}><option value="">Cualquiera</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></label>
    <Num name="min" title="Precio mín." value={f.min} placeholder="$"/>
    <Num name="max" title="Precio máx." value={f.max} placeholder="$"/>
    <Select name="combustible" title="Combustible" value={f.combustible} values={fuels}/>
    <Select name="transmision" title="Transmisión" value={f.transmision} values={transmissions} any="Todas"/>
    <SortSelect value={f.orden}/>
  </Shell>;
}
