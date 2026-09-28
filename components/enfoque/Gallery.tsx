"use client";
import {useCallback,useEffect,useState} from "react";
import {ListingImage} from "./ListingImage";

// Galería de la ficha: mosaico + visor a pantalla completa con teclado y deslizamiento.
export function Gallery({images,title,layout="property"}:{images:string[];title:string;layout?:"property"|"vehicle"}){
  const [open,setOpen]=useState<number|null>(null);
  const [touchX,setTouchX]=useState<number|null>(null);
  const go=useCallback((d:number)=>setOpen(i=>i===null?null:(i+d+images.length)%images.length),[images.length]);
  useEffect(()=>{
    if(open===null)return;
    const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(null);if(e.key==="ArrowRight")go(1);if(e.key==="ArrowLeft")go(-1);};
    document.addEventListener("keydown",onKey);document.body.style.overflow="hidden";
    return ()=>{document.removeEventListener("keydown",onKey);document.body.style.overflow="";};
  },[open,go]);
  if(!images.length)return <div className="flex aspect-[16/9] items-center justify-center rounded-3xl bg-black/5 text-sm font-bold text-black/40">Fotografías próximamente</div>;
  const shown=images.slice(0,5);
  return <>
    <div className={"grid gap-3 "+(layout==="property"?"md:grid-cols-3":"md:grid-cols-2")}>
      {shown.map((src,i)=>{
        const big=layout==="property"&&i===0;
        const solo=shown.length===1;
        return <button type="button" key={src} onClick={()=>setOpen(i)} aria-label={`Ver foto ${i+1} de ${images.length}`}
          className={"group relative overflow-hidden rounded-3xl bg-black/5 "+(solo?"aspect-[16/9] md:col-span-full":big?"aspect-[16/10] md:col-span-2 md:row-span-2 md:aspect-auto":"aspect-[4/3]")+(i>0?" hidden md:block":"")}>
          <ListingImage src={src} alt={`${title} — foto ${i+1}`} priority={i===0} sizes={big?"(min-width:768px) 66vw, 100vw":"(min-width:768px) 33vw, 100vw"} className="object-cover transition duration-500 group-hover:scale-[1.03]"/>
          {i===0&&images.length>1&&<span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-3 py-1.5 text-xs font-bold text-white md:hidden">1 / {images.length} · Ver fotos</span>}
          {i===shown.length-1&&images.length>shown.length&&<span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-black text-white">+{images.length-shown.length} fotos</span>}
        </button>;
      })}
    </div>
    {open!==null&&<div role="dialog" aria-modal="true" aria-label={`Fotos de ${title}`} className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white"
      onTouchStart={e=>setTouchX(e.touches[0].clientX)} onTouchEnd={e=>{if(touchX===null)return;const dx=e.changedTouches[0].clientX-touchX;if(Math.abs(dx)>50)go(dx<0?1:-1);setTouchX(null);}}>
      <div className="flex items-center justify-between p-4 text-sm font-bold"><span>{open+1} / {images.length}</span><button type="button" onClick={()=>setOpen(null)} className="rounded-full bg-white/10 px-4 py-2" aria-label="Cerrar">✕ Cerrar</button></div>
      <div className="relative flex-1"><ListingImage key={images[open]} src={images[open]} alt={`${title} — foto ${open+1}`} sizes="100vw" priority className="object-contain"/></div>
      {images.length>1&&<div className="flex justify-between p-4"><button type="button" onClick={()=>go(-1)} className="rounded-full bg-white/10 px-5 py-3 font-black" aria-label="Foto anterior">←</button><button type="button" onClick={()=>go(1)} className="rounded-full bg-white/10 px-5 py-3 font-black" aria-label="Foto siguiente">→</button></div>}
    </div>}
  </>;
}
