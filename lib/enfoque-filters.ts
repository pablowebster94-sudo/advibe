import type {Property,Vehicle} from "@/lib/enfoque-data";

// Filtros del catálogo. Viven en la URL (?ciudad=cuenca&min=50000) para que
// los resultados se puedan compartir, indexar y usar como destino de anuncios.

export type SearchParams={[key:string]:string|string[]|undefined};

export function norm(value:unknown){
  return String(value??"").normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toLowerCase();
}

const LABELS:Record<string,string>={
  casa:"Casa",departamento:"Departamento",terreno:"Terreno",oficina:"Oficina",local:"Local comercial",bodega:"Bodega",quinta:"Quinta",otro:"Otro",
  venta:"Venta",alquiler:"Alquiler",
  gasolina:"Gasolina",diesel:"Diésel",hibrido:"Híbrido",electrico:"Eléctrico",gas:"Gas",
  automatica:"Automática",manual:"Manual",otra:"Otra",
  disponible:"Disponible",reservado:"Reservado",vendido:"Vendido",alquilado:"Alquilado"
};
export function label(value:string){
  const key=norm(value);
  return LABELS[key]||(value?value.charAt(0).toUpperCase()+value.slice(1):value);
}

function one(sp:SearchParams,key:string){
  const v=sp[key];
  return (Array.isArray(v)?v[0]:v)?.trim().slice(0,80)||"";
}
function num(sp:SearchParams,key:string){
  const v=one(sp,key).replace(/[^\d.]/g,"");
  const n=v?Number(v):NaN;
  return Number.isFinite(n)&&n>=0?n:undefined;
}

export type Sort="recientes"|"precio_asc"|"precio_desc";
function sortOf(sp:SearchParams):Sort{
  const s=one(sp,"orden");
  return s==="precio_asc"||s==="precio_desc"?s:"recientes";
}
function sortBy<T extends {price:number}>(items:T[],sort:Sort){
  if(sort==="recientes")return items;
  return [...items].sort((a,b)=>sort==="precio_asc"?a.price-b.price:b.price-a.price);
}

export type PropertyFilters={q:string;operacion:string;ciudad:string;tipo:string;min?:number;max?:number;habitaciones?:number;orden:Sort};

export function readPropertyFilters(sp:SearchParams):PropertyFilters{
  return {q:one(sp,"q"),operacion:norm(one(sp,"operacion")),ciudad:one(sp,"ciudad"),tipo:one(sp,"tipo"),
    min:num(sp,"min"),max:num(sp,"max"),habitaciones:num(sp,"habitaciones"),orden:sortOf(sp)};
}

export function filterProperties(items:Property[],f:PropertyFilters){
  const q=norm(f.q);
  return sortBy(items.filter(x=>
    (!f.operacion||norm(x.operation)===f.operacion)&&
    (!f.ciudad||norm(x.city)===norm(f.ciudad))&&
    (!f.tipo||norm(x.type)===norm(f.tipo))&&
    (f.min===undefined||x.price>=f.min)&&
    (f.max===undefined||x.price<=f.max)&&
    (f.habitaciones===undefined||(x.rooms??0)>=f.habitaciones)&&
    (!q||norm([x.title,x.city,x.sector,x.type,x.description,...x.features].join(" ")).includes(q))
  ),f.orden);
}

export type VehicleFilters={q:string;marca:string;desde?:number;hasta?:number;min?:number;max?:number;combustible:string;transmision:string;orden:Sort};

export function readVehicleFilters(sp:SearchParams):VehicleFilters{
  return {q:one(sp,"q"),marca:one(sp,"marca"),desde:num(sp,"desde"),hasta:num(sp,"hasta"),min:num(sp,"min"),max:num(sp,"max"),
    combustible:one(sp,"combustible"),transmision:one(sp,"transmision"),orden:sortOf(sp)};
}

export function filterVehicles(items:Vehicle[],f:VehicleFilters){
  const q=norm(f.q);
  return sortBy(items.filter(x=>
    (!f.marca||norm(x.brand)===norm(f.marca))&&
    (f.desde===undefined||x.year>=f.desde)&&
    (f.hasta===undefined||x.year<=f.hasta)&&
    (f.min===undefined||x.price>=f.min)&&
    (f.max===undefined||x.price<=f.max)&&
    (!f.combustible||norm(x.fuel)===norm(f.combustible))&&
    (!f.transmision||norm(x.transmission)===norm(f.transmision))&&
    (!q||norm([x.brand,x.model,x.engine,x.description,...x.features].join(" ")).includes(q))
  ),f.orden);
}

/** Valores únicos (por forma normalizada) para poblar los <select> de filtros. */
export function options(values:Array<string|number|undefined|null>){
  const seen=new Map<string,string>();
  for(const v of values){
    if(v===undefined||v===null||v==="")continue;
    const key=norm(v);
    if(!seen.has(key))seen.set(key,String(v));
  }
  return [...seen.values()].sort((a,b)=>a.localeCompare(b,"es",{numeric:true}));
}

export function activeFilterCount(f:Record<string,unknown>){
  return Object.entries(f).filter(([k,v])=>k!=="orden"&&v!==undefined&&v!=="").length;
}

// "Otras propiedades" en las fichas: mismo tipo o cantón (vehículos: misma marca, ciudad o
// precio parecido), excluyendo la actual. Disponibles primero y luego la más cercana en precio.
const unavailable=(x:{availability?:string})=>Boolean(x.availability&&x.availability!=="disponible");
function rank<T extends {id:string;price:number;availability?:string}>(items:T[],current:T,score:(x:T)=>number,n:number){
  return items.filter(x=>x.id!==current.id).map(x=>({x,s:score(x)})).filter(r=>r.s>=1)
    .sort((a,b)=>Number(unavailable(a.x))-Number(unavailable(b.x))||b.s-a.s||Math.abs(a.x.price-current.price)-Math.abs(b.x.price-current.price))
    .slice(0,n).map(r=>r.x);
}
export function similarProperties(items:Property[],current:Property,n=3){
  return rank(items,current,x=>(norm(x.type)===norm(current.type)?2:0)+(norm(x.city)===norm(current.city)?1:0)+(x.operation===current.operation?0.5:0),n);
}
export function similarVehicles(items:Vehicle[],current:Vehicle,n=3){
  const near=(p:number)=>current.price>0&&Math.abs(p-current.price)/current.price<=0.3;
  return rank(items,current,x=>(norm(x.brand)===norm(current.brand)?2:0)+(current.city&&norm(x.city)===norm(current.city)?1:0)+(near(x.price)?1:0),n);
}
