import {parseVideoUrl} from "@/lib/enfoque-video";

// Validación y normalización de lo que el panel envía al crear/editar.
// Se usa igual en POST (crear) y PATCH (editar) para que ambos flujos acepten los mismos campos.

export const PROPERTY_TYPES=["casa","departamento","terreno","oficina","local","bodega","quinta","otro"];
export const OPERATIONS=["venta","alquiler"];
export const PUBLICATION=["borrador","publicado","archivado"];
export const AVAILABILITY=["disponible","reservado","vendido","alquilado"];
export const FUELS=["gasolina","diesel","hibrido","electrico","gas","otro"];
export const TRANSMISSIONS=["automatica","manual","otra"];
export const CONDITIONS=["usado","nuevo"];

export function slugify(value:string){
  return value.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()
    .replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,120).replace(/-+$/,"");
}

type Body=Record<string,unknown>;
type Result<T>={ok:true;data:T}|{ok:false;error:string};

const str=(v:unknown)=>typeof v==="string"?v.trim():v===undefined||v===null?"":String(v).trim();
const oneOf=(v:unknown,list:string[],fallback:string)=>list.includes(str(v))?str(v):fallback;
function optNum(v:unknown,{int=false,max=1e9}={}){
  const s=str(v).replace(",",".");
  if(!s)return null;
  const n=Number(s);
  if(!Number.isFinite(n)||n<0||n>max)return NaN;
  return int?Math.round(n):n;
}
export function features(v:unknown){
  const list=Array.isArray(v)?v:str(v).split("\n");
  return [...new Set(list.map(x=>str(x).replace(/^[-•✓*]\s*/,"")).filter(Boolean))].slice(0,40).map(x=>x.slice(0,120));
}
function video(v:unknown):string|null|undefined{
  const s=str(v);
  if(!s)return null;
  return parseVideoUrl(s)?s:undefined;
}

export function propertyPayload(b:Body):Result<Record<string,unknown>>{
  const title=str(b.title),city=str(b.city),slug=slugify(str(b.slug)||title);
  const price=optNum(b.price);
  if(title.length<5)return {ok:false,error:"El título debe tener al menos 5 caracteres."};
  if(!slug)return {ok:false,error:"El slug no es válido."};
  if(!city)return {ok:false,error:"La ciudad es obligatoria."};
  if(price===null||Number.isNaN(price))return {ok:false,error:"El precio no es válido."};
  const nums={land_area_m2:optNum(b.land_area_m2),built_area_m2:optNum(b.built_area_m2),bedrooms:optNum(b.bedrooms,{int:true,max:50}),
    bathrooms:optNum(b.bathrooms,{max:50}),parking_spots:optNum(b.parking_spots,{int:true,max:100})};
  const bad=Object.entries(nums).find(([,n])=>Number.isNaN(n));
  if(bad)return {ok:false,error:`El campo ${bad[0]} no es válido.`};
  if(nums.bathrooms!==null)nums.bathrooms=Math.round(nums.bathrooms*2)/2;
  const video_url=video(b.video_url);
  if(video_url===undefined)return {ok:false,error:"El video debe ser un enlace https de YouTube, Vimeo o un archivo .mp4/.webm."};
  return {ok:true,data:{
    title:title.slice(0,160),slug,price,city,province:str(b.province)||"Azuay",sector:str(b.sector)||null,description:str(b.description),
    property_type:oneOf(b.property_type,PROPERTY_TYPES,"casa"),operation_type:oneOf(b.operation_type,OPERATIONS,"venta"),
    publication_status:oneOf(b.publication_status,PUBLICATION,"borrador"),availability:oneOf(b.availability,AVAILABILITY,"disponible"),
    is_featured:Boolean(b.is_featured),...nums,features:features(b.features),video_url
  }};
}

export function vehiclePayload(b:Body):Result<Record<string,unknown>>{
  const brand=str(b.brand),model=str(b.model),year=optNum(b.year,{int:true,max:2100}),price=optNum(b.price);
  const slug=slugify(str(b.slug)||[brand,model,year].filter(Boolean).join(" "));
  if(!brand||!model)return {ok:false,error:"Marca y modelo son obligatorios."};
  if(year===null||Number.isNaN(year)||year<1950)return {ok:false,error:"El año no es válido."};
  if(price===null||Number.isNaN(price))return {ok:false,error:"El precio no es válido."};
  if(!slug)return {ok:false,error:"El slug no es válido."};
  const mileage=optNum(b.mileage_km,{int:true,max:5_000_000});
  if(Number.isNaN(mileage))return {ok:false,error:"El kilometraje no es válido."};
  const video_url=video(b.video_url);
  if(video_url===undefined)return {ok:false,error:"El video debe ser un enlace https de YouTube, Vimeo o un archivo .mp4/.webm."};
  return {ok:true,data:{
    brand:brand.slice(0,80),model:model.slice(0,80),slug,year,price,mileage_km:mileage??0,
    condition:oneOf(b.condition,CONDITIONS,"usado"),fuel:oneOf(b.fuel,FUELS,"gasolina"),transmission:oneOf(b.transmission,TRANSMISSIONS,"automatica"),
    engine:str(b.engine)||null,description:str(b.description),city:str(b.city)||null,province:str(b.province)||null,
    publication_status:oneOf(b.publication_status,PUBLICATION,"borrador"),availability:oneOf(b.availability,AVAILABILITY,"disponible"),
    is_featured:Boolean(b.is_featured),features:features(b.features),video_url
  }};
}

/** Traduce errores de Supabase/PostgREST a mensajes útiles para el panel. */
export function dbError(error:unknown,fallback:string){
  const text=String((error as Error)?.message||error);
  if(text.includes("slug_key")||text.includes("23505"))return "Ya existe una publicación con ese slug. Cambia el slug.";
  if(text.includes("title")&&text.includes("check"))return "El título debe tener entre 5 y 160 caracteres.";
  return fallback;
}
