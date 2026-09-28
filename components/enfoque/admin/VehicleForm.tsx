"use client";
import {useState} from "react";
import type {VehicleRow} from "@/lib/enfoque-types";
import Link from "next/link";
import {slugify} from "@/lib/enfoque-listing";
import {parseVideoUrl} from "@/lib/enfoque-video";
import {AdminImages} from "../AdminImages";
import type {ImageItem} from "./upload";
import {Checklist,Field,PendingImages,Section,SelectField,TextArea,Toggle,VideoField} from "./fields";
import {useListingSave} from "./useListingSave";

const s=(v:unknown)=>v===null||v===undefined?"":String(v);

export function VehicleForm({item,images=[],notice}:{item?:Partial<VehicleRow>&{id:string};images?:ImageItem[];notice?:string}){
  const editing=Boolean(item?.id);
  const [f,setF]=useState({brand:s(item?.brand),model:s(item?.model),slug:s(item?.slug),year:s(item?.year),price:s(item?.price),mileage_km:s(item?.mileage_km),
    fuel:String(item?.fuel||"gasolina"),transmission:String(item?.transmission||"automatica"),engine:s(item?.engine),condition:String(item?.condition||"usado"),
    city:s(item?.city)||"Cuenca",province:s(item?.province)||"Azuay",description:s(item?.description),
    publication_status:String(item?.publication_status||"borrador"),availability:String(item?.availability||"disponible"),is_featured:Boolean(item?.is_featured),
    features:((item?.features||[]) as string[]).join("\n"),video_url:s(item?.video_url)});
  const [slugTouched,setSlugTouched]=useState(editing);
  const [files,setFiles]=useState<File[]>([]);
  const {msg,busy,save,remove}=useListingSave({type:"vehicle",id:item?.id,endpoint:"/api/enfoque/admin/vehiculos",adminPath:"/enfoque-visual/admin/vehiculos"});
  const set=(k:keyof typeof f)=>(v:unknown)=>setF(x=>{const next={...x,[k]:v};if(!slugTouched&&["brand","model","year"].includes(k))next.slug=slugify([next.brand,next.model,next.year].join(" "));return next;});
  const on=(k:keyof typeof f)=>(e:React.ChangeEvent<HTMLInputElement>)=>set(k)(e.target.value);
  const title=[f.brand,f.model,f.year].filter(Boolean).join(" ");
  const photos=editing?images.length:files.length;
  const checks=[
    {label:"Marca, modelo, año y precio",ok:Boolean(f.brand&&f.model&&f.year&&Number(f.price)>0),required:true},
    {label:"Descripción (mín. 120 caracteres)",ok:f.description.trim().length>=120},
    {label:"Al menos 6 fotos",ok:photos>=6},
    {label:"Video",ok:Boolean(parseVideoUrl(f.video_url))},
    {label:"Kilometraje y motor",ok:Boolean(f.mileage_km&&f.engine)},
    {label:"Al menos 3 elementos de equipamiento",ok:f.features.split("\n").filter(x=>x.trim()).length>=3}
  ];
  async function submit(e:React.FormEvent,status?:string){
    e.preventDefault();
    const publication_status=status||f.publication_status;
    if(publication_status==="publicado"&&photos===0&&!confirm("Vas a publicar sin fotos. ¿Continuar?"))return;
    if(f.video_url&&!parseVideoUrl(f.video_url))return;
    setF(x=>({...x,publication_status}));
    await save({...f,publication_status,slug:f.slug||slugify(title)},files,title);
  }
  return <main className="min-h-screen bg-[#f5f3ee] px-5 py-10"><div className="mx-auto max-w-6xl">
    <Link href="/enfoque-visual/admin/vehiculos" className="text-sm font-bold underline">← Vehículos</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><h1 className="ev-display text-5xl font-black">{editing?"Editar vehículo":"Nuevo vehículo"}</h1>
      {item?.publication_status==="publicado"&&<a href={"/enfoque-visual/vehiculos/"+item?.slug} target="_blank" className="rounded-full bg-white px-5 py-3 text-sm font-bold ring-1 ring-black/10">Ver ficha publicada ↗</a>}</div>
    {notice&&<p className="mt-6 rounded-2xl bg-[#d9ff3f] px-5 py-4 text-sm font-bold" role="status">{notice}</p>}
    <form onSubmit={e=>submit(e)} className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
      <div className="space-y-6">
        <Section title="Datos principales">
          <Field label="Marca" required value={f.brand} onChange={on("brand")} placeholder="Toyota"/>
          <Field label="Modelo" required value={f.model} onChange={on("model")} placeholder="Fortuner"/>
          <Field label="Año" required type="number" min={1950} max={2100} value={f.year} onChange={on("year")}/>
          <Field label="Precio (USD)" required type="number" min={0} step="any" inputMode="decimal" value={f.price} onChange={on("price")}/>
          <Field label="Slug (URL)" required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Minúsculas, números y guiones" value={f.slug} onChange={e=>{setSlugTouched(true);setF(x=>({...x,slug:slugify(e.target.value)||e.target.value.toLowerCase()}));}}/>
          <SelectField label="Condición" value={f.condition} onChange={set("condition")} options={[["usado","Usado"],["nuevo","Nuevo"]]}/>
          <Field label="Ciudad" value={f.city} onChange={on("city")}/>
          <Field label="Provincia" value={f.province} onChange={on("province")}/>
        </Section>
        <Section title="Ficha técnica" hint="Alimenta los filtros del catálogo.">
          <Field label="Kilometraje" type="number" min={0} step={1} value={f.mileage_km} onChange={on("mileage_km")}/>
          <Field label="Motor" value={f.engine} onChange={on("engine")} placeholder="2.8 Turbo diésel"/>
          <SelectField label="Combustible" value={f.fuel} onChange={set("fuel")} options={[["gasolina","Gasolina"],["diesel","Diésel"],["hibrido","Híbrido"],["electrico","Eléctrico"],["gas","Gas"],["otro","Otro"]]}/>
          <SelectField label="Transmisión" value={f.transmission} onChange={set("transmission")} options={[["automatica","Automática"],["manual","Manual"],["otra","Otra"]]}/>
        </Section>
        <Section title="Descripción y equipamiento">
          <TextArea label="Descripción" value={f.description} onChange={set("description")} rows={7}/>
          <TextArea label="Equipamiento" hint="uno por línea" value={f.features} onChange={set("features")} rows={6}/>
        </Section>
        <Section title="Fotos y video" hint={editing?"Las fotos se guardan al instante (abajo).":"La primera foto será la portada. Se suben al crear la publicación."}>
          {!editing&&<PendingImages files={files} onChange={setFiles}/>}
          <VideoField value={f.video_url} onChange={set("video_url")}/>
        </Section>
      </div>
      <div className="space-y-4 lg:sticky lg:top-6">
        <div className="space-y-4 rounded-3xl bg-white p-6">
          <SelectField label="Estado" value={f.publication_status} onChange={set("publication_status")} options={[["borrador","Borrador"],["publicado","Publicado"],["archivado","Archivado"]]}/>
          <SelectField label="Disponibilidad" value={f.availability} onChange={set("availability")} options={[["disponible","Disponible"],["reservado","Reservado"],["vendido","Vendido"]]}/>
          <Toggle label="Destacar publicación" hint="Aparece primero en la portada." checked={f.is_featured} onChange={set("is_featured")}/>
          <button disabled={busy} className="w-full rounded-full bg-black px-6 py-3 font-black text-white disabled:opacity-60">{editing?"Guardar cambios":"Crear"}</button>
          {f.publication_status!=="publicado"&&<button type="button" disabled={busy} onClick={e=>submit(e,"publicado")} className="w-full rounded-full bg-[#d9ff3f] px-6 py-3 font-black disabled:opacity-60">{editing?"Guardar y publicar":"Crear y publicar"}</button>}
          {editing&&<button type="button" onClick={remove} className="w-full rounded-full bg-red-50 px-6 py-3 text-sm font-black text-red-700">Eliminar</button>}
          {msg&&<p className="text-sm font-bold" role="status">{msg}</p>}
        </div>
        <Checklist items={checks}/>
      </div>
    </form>
    {item?.id&&<AdminImages listingId={item.id} type="vehicle" initial={images} alt={title}/>}
  </div></main>;
}
