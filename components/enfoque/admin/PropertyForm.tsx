"use client";
import {useState} from "react";
import Link from "next/link";
import {slugify} from "@/lib/enfoque-listing";
import {parseVideoUrl} from "@/lib/enfoque-video";
import {AdminImages} from "../AdminImages";
import type {ImageItem} from "./upload";
import {Checklist,Field,PendingImages,Section,SelectField,TextArea,Toggle,VideoField} from "./fields";
import {useListingSave} from "./useListingSave";

const TYPES:[string,string][]=[["casa","Casa"],["departamento","Departamento"],["terreno","Terreno"],["oficina","Oficina"],["local","Local comercial"],["bodega","Bodega"],["quinta","Quinta"],["otro","Otro"]];
const s=(v:unknown)=>v===null||v===undefined?"":String(v);

export function PropertyForm({item,images=[],notice}:{item?:any;images?:ImageItem[];notice?:string}){
  const editing=Boolean(item?.id);
  const [f,setF]=useState({title:s(item?.title),slug:s(item?.slug),price:s(item?.price),city:s(item?.city)||"Cuenca",province:s(item?.province)||"Azuay",sector:s(item?.sector),
    description:s(item?.description),property_type:item?.property_type||"casa",operation_type:item?.operation_type||"venta",
    publication_status:item?.publication_status||"borrador",availability:item?.availability||"disponible",is_featured:Boolean(item?.is_featured),
    land_area_m2:s(item?.land_area_m2),built_area_m2:s(item?.built_area_m2),bedrooms:s(item?.bedrooms),bathrooms:s(item?.bathrooms),parking_spots:s(item?.parking_spots),
    features:((item?.features||[]) as string[]).join("\n"),video_url:s(item?.video_url)});
  const [slugTouched,setSlugTouched]=useState(editing);
  const [files,setFiles]=useState<File[]>([]);
  const {msg,busy,save,remove}=useListingSave({type:"property",id:item?.id,endpoint:"/api/enfoque/admin/properties",adminPath:"/enfoque-visual/admin/propiedades"});
  const set=(k:keyof typeof f)=>(v:unknown)=>setF(x=>({...x,[k]:v}));
  const on=(k:keyof typeof f)=>(e:React.ChangeEvent<HTMLInputElement>)=>set(k)(e.target.value);
  const land=f.property_type==="terreno";
  const photos=editing?images.length:files.length;
  const checks=[
    {label:"Título, precio y ciudad",ok:f.title.trim().length>=5&&Number(f.price)>0&&Boolean(f.city.trim()),required:true},
    {label:"Descripción (mín. 120 caracteres)",ok:f.description.trim().length>=120},
    {label:"Al menos 5 fotos",ok:photos>=5},
    {label:"Video",ok:Boolean(parseVideoUrl(f.video_url))},
    {label:land?"Metros de terreno":"Metros, dormitorios y baños",ok:land?Boolean(f.land_area_m2):Boolean((f.built_area_m2||f.land_area_m2)&&f.bedrooms&&f.bathrooms)},
    {label:"Al menos 3 características",ok:f.features.split("\n").filter(x=>x.trim()).length>=3}
  ];
  async function submit(e:React.FormEvent,status?:string){
    e.preventDefault();
    const publication_status=status||f.publication_status;
    if(publication_status==="publicado"&&photos===0&&!confirm("Vas a publicar sin fotos. ¿Continuar?"))return;
    if(f.video_url&&!parseVideoUrl(f.video_url))return;
    setF(x=>({...x,publication_status}));
    await save({...f,publication_status,slug:f.slug||slugify(f.title)},files,f.title);
  }
  return <main className="min-h-screen bg-[#f5f3ee] px-5 py-10"><div className="mx-auto max-w-6xl">
    <Link href="/enfoque-visual/admin/propiedades" className="text-sm font-bold underline">← Propiedades</Link>
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><h1 className="ev-display text-5xl font-black">{editing?"Editar propiedad":"Nueva propiedad"}</h1>
      {editing&&item.publication_status==="publicado"&&<a href={"/enfoque-visual/propiedades/"+item.slug} target="_blank" className="rounded-full bg-white px-5 py-3 text-sm font-bold ring-1 ring-black/10">Ver ficha publicada ↗</a>}</div>
    {notice&&<p className="mt-6 rounded-2xl bg-[#d9ff3f] px-5 py-4 text-sm font-bold" role="status">{notice}</p>}
    <form onSubmit={e=>submit(e)} className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
      <div className="space-y-6">
        <Section title="Datos principales">
          <Field label="Título" required minLength={5} maxLength={160} wide value={f.title} onChange={e=>{const v=e.target.value;setF(x=>({...x,title:v,slug:slugTouched?x.slug:slugify(v)}));}} placeholder="Casa contemporánea en Gualaceo"/>
          <SelectField label="Operación" value={f.operation_type} onChange={set("operation_type")} options={[["venta","Venta"],["alquiler","Alquiler"]]}/>
          <SelectField label="Tipo" value={f.property_type} onChange={set("property_type")} options={TYPES}/>
          <Field label={f.operation_type==="alquiler"?"Precio mensual (USD)":"Precio (USD)"} required type="number" min={0} step="any" inputMode="decimal" value={f.price} onChange={on("price")}/>
          <Field label="Slug (URL)" required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Minúsculas, números y guiones" value={f.slug} onChange={e=>{setSlugTouched(true);set("slug")(slugify(e.target.value)||e.target.value.toLowerCase());}}/>
          <Field label="Ciudad" required value={f.city} onChange={on("city")}/>
          <Field label="Sector" value={f.sector} onChange={on("sector")} placeholder="El Batán"/>
          <Field label="Provincia" value={f.province} onChange={on("province")}/>
        </Section>
        <Section title="Medidas y distribución" hint="Se muestran como datos destacados en la ficha y alimentan los filtros.">
          <Field label="Construcción (m²)" type="number" min={0} step="any" value={f.built_area_m2} onChange={on("built_area_m2")}/>
          <Field label="Terreno (m²)" type="number" min={0} step="any" value={f.land_area_m2} onChange={on("land_area_m2")}/>
          {!land&&<><Field label="Dormitorios" type="number" min={0} step={1} value={f.bedrooms} onChange={on("bedrooms")}/>
          <Field label="Baños" type="number" min={0} step={0.5} value={f.bathrooms} onChange={on("bathrooms")}/>
          <Field label="Parqueaderos" type="number" min={0} step={1} value={f.parking_spots} onChange={on("parking_spots")}/></>}
        </Section>
        <Section title="Descripción y características">
          <TextArea label="Descripción" value={f.description} onChange={set("description")} rows={7}/>
          <TextArea label="Características" hint="una por línea" value={f.features} onChange={set("features")} rows={6}/>
        </Section>
        <Section title="Fotos y video" hint={editing?"Las fotos se guardan al instante (abajo).":"La primera foto será la portada. Se suben al crear la publicación."}>
          {!editing&&<PendingImages files={files} onChange={setFiles}/>}
          <VideoField value={f.video_url} onChange={set("video_url")}/>
        </Section>
      </div>
      <div className="space-y-4 lg:sticky lg:top-6">
        <div className="space-y-4 rounded-3xl bg-white p-6">
          <SelectField label="Estado" value={f.publication_status} onChange={set("publication_status")} options={[["borrador","Borrador"],["publicado","Publicado"],["archivado","Archivado"]]}/>
          <SelectField label="Disponibilidad" value={f.availability} onChange={set("availability")} options={[["disponible","Disponible"],["reservado","Reservado"],["vendido","Vendido"],["alquilado","Alquilado"]]}/>
          <Toggle label="Destacar publicación" hint="Aparece primero en la portada." checked={f.is_featured} onChange={set("is_featured")}/>
          <button disabled={busy} className="w-full rounded-full bg-black px-6 py-3 font-black text-white disabled:opacity-60">{editing?"Guardar cambios":"Crear"}</button>
          {f.publication_status!=="publicado"&&<button type="button" disabled={busy} onClick={e=>submit(e,"publicado")} className="w-full rounded-full bg-[#d9ff3f] px-6 py-3 font-black disabled:opacity-60">{editing?"Guardar y publicar":"Crear y publicar"}</button>}
          {editing&&<button type="button" onClick={remove} className="w-full rounded-full bg-red-50 px-6 py-3 text-sm font-black text-red-700">Eliminar</button>}
          {msg&&<p className="text-sm font-bold" role="status">{msg}</p>}
        </div>
        <Checklist items={checks}/>
      </div>
    </form>
    {editing&&<AdminImages listingId={item.id} type="property" initial={images} alt={f.title}/>}
  </div></main>;
}
