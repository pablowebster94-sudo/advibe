"use client";
import {useState} from "react";
import {ACCEPT,checkFile,publicUrl,uploadImage,type ImageItem} from "./admin/upload";

// Fotos de una publicación ya creada: subida múltiple, portada, orden (arrastrar o flechas) y borrado.
export function AdminImages({listingId,type,initial,alt}:{listingId:string;type:"property"|"vehicle";initial:ImageItem[];alt:string}){
  const sorted=[...initial].sort((a,b)=>a.sort_order-b.sort_order);
  const [images,setImages]=useState(sorted);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState("");
  const [dragging,setDragging]=useState<string|null>(null);
  const [dirty,setDirty]=useState(false);

  async function upload(files:FileList|File[]){
    const list=[...files];if(!list.length)return;
    setBusy(true);const errors:string[]=[];
    for(const [i,file] of list.entries()){
      const bad=checkFile(file);if(bad){errors.push(bad);continue;}
      setMsg(`Subiendo ${i+1} de ${list.length}…`);
      try{const item=await uploadImage(file,type,listingId,alt);setImages(x=>[...x,item]);}
      catch(e){errors.push((e as Error).message);}
    }
    setMsg(errors.length?errors.join(" · "):`${list.length===1?"Foto subida":list.length+" fotos subidas"}.`);
    setBusy(false);
  }
  async function remove(id:string){
    if(!confirm("¿Eliminar esta foto?"))return;
    const r=await fetch("/api/enfoque/admin/listing-images",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
    const d=await r.json().catch(()=>({}));
    if(r.ok)setImages(x=>x.filter(i=>i.id!==id).map(i=>d.new_cover&&i.id===d.new_cover?{...i,is_cover:true}:i));
    else setMsg(d.error||"No se pudo eliminar.");
  }
  async function cover(id:string){
    const r=await fetch("/api/enfoque/admin/listing-images/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_cover:true})});
    if(r.ok)setImages(x=>x.map(i=>({...i,is_cover:i.id===id})));else setMsg("No se pudo cambiar la portada.");
  }
  function move(from:number,to:number){
    if(to<0||to>=images.length||from===to)return;
    setImages(x=>{const next=[...x];const [it]=next.splice(from,1);next.splice(to,0,it);return next;});
    setDirty(true);
  }
  async function saveOrder(){
    setMsg("Guardando orden…");
    const r=await fetch("/api/enfoque/admin/listing-images",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids:images.map(i=>i.id)})});
    if(r.ok){setImages(x=>x.map((i,n)=>({...i,sort_order:n})));setDirty(false);setMsg("Orden guardado.");}
    else setMsg("No se pudo guardar el orden.");
  }

  return <section className="mt-8 rounded-3xl bg-white p-6" onDragOver={e=>{if(e.dataTransfer.types.includes("Files"))e.preventDefault();}} onDrop={e=>{if(e.dataTransfer.files.length){e.preventDefault();upload(e.dataTransfer.files);}}}>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-2xl font-black">Fotografías</h2><p className="text-sm text-black/50">JPG, PNG, WEBP o AVIF · máx. 8 MB c/u · arrastra para ordenar · la portada es la que se ve en el catálogo.</p></div>
      <div className="flex gap-2">
        {dirty&&<button type="button" onClick={saveOrder} className="rounded-full bg-[#d9ff3f] px-5 py-3 text-sm font-black">Guardar orden</button>}
        <label className={"cursor-pointer rounded-full bg-black px-5 py-3 text-sm font-bold text-white "+(busy?"opacity-60":"")}>{busy?"Subiendo…":"+ Añadir fotos"}<input disabled={busy} type="file" multiple accept={ACCEPT} onChange={e=>{if(e.target.files)upload(e.target.files);e.target.value="";}} className="hidden"/></label>
      </div>
    </div>
    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">{images.map((i,n)=><div key={i.id} draggable onDragStart={()=>setDragging(i.id)} onDragEnd={()=>setDragging(null)}
      onDragOver={e=>{if(dragging)e.preventDefault();}} onDrop={e=>{if(!dragging)return;e.preventDefault();move(images.findIndex(x=>x.id===dragging),n);setDragging(null);}}
      className={"overflow-hidden rounded-2xl bg-black/5 ring-2 "+(i.is_cover?"ring-[#d9ff3f]":"ring-transparent")+(dragging===i.id?" opacity-40":"")}>
      <div className="relative"><img src={publicUrl(i.storage_path)} alt={i.alt_text||""} className="aspect-square w-full cursor-grab object-cover"/><span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white">{n+1}</span></div>
      <div className="flex gap-1 p-2">
        <button type="button" aria-label="Mover antes" onClick={()=>move(n,n-1)} disabled={n===0} className="rounded-lg bg-black/5 px-2 py-2 text-xs font-bold disabled:opacity-30">←</button>
        <button type="button" onClick={()=>cover(i.id)} className={"flex-1 rounded-lg px-2 py-2 text-xs font-bold "+(i.is_cover?"bg-[#d9ff3f]":"bg-black/5")}>{i.is_cover?"Portada":"Hacer portada"}</button>
        <button type="button" aria-label="Mover después" onClick={()=>move(n,n+1)} disabled={n===images.length-1} className="rounded-lg bg-black/5 px-2 py-2 text-xs font-bold disabled:opacity-30">→</button>
        <button type="button" aria-label="Eliminar foto" onClick={()=>remove(i.id)} className="rounded-lg bg-red-50 px-2 py-2 text-xs font-bold text-red-700">×</button>
      </div>
    </div>)}</div>
    {!images.length&&<p className="mt-5 rounded-2xl border-2 border-dashed border-black/10 p-8 text-center text-sm text-black/50">Todavía no hay fotografías. Arrastra imágenes aquí o usa “Añadir fotos”.</p>}
    {msg&&<p className="mt-4 text-sm font-bold" role="status">{msg}</p>}
  </section>;
}
