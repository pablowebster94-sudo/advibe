"use client";
import {useEffect,useMemo,useState} from "react";
import {parseVideoUrl} from "@/lib/enfoque-video";
import {ACCEPT,checkFile} from "./upload";

export const inputCls="mt-1 w-full rounded-xl bg-black/5 p-3 text-sm font-normal outline-none ring-1 ring-transparent focus:ring-black";

export function Section({title,hint,children}:{title:string;hint?:string;children:React.ReactNode}){
  return <fieldset className="rounded-3xl bg-white p-6"><legend className="sr-only">{title}</legend>
    <h2 className="text-xl font-black">{title}</h2>{hint&&<p className="mt-1 text-sm text-black/50">{hint}</p>}
    <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div></fieldset>;
}

export function Field({label,wide,...props}:{label:string;wide?:boolean}&React.InputHTMLAttributes<HTMLInputElement>){
  return <label className={"block text-sm font-bold"+(wide?" md:col-span-2":"")}>{label}{props.required&&<span className="text-red-600"> *</span>}<input {...props} className={inputCls}/></label>;
}

export function SelectField({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:[string,string][]}){
  return <label className="block text-sm font-bold">{label}<select value={value} onChange={e=>onChange(e.target.value)} className={inputCls}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>;
}

export function TextArea({label,hint,value,onChange,rows=6}:{label:string;hint?:string;value:string;onChange:(v:string)=>void;rows?:number}){
  return <label className="block text-sm font-bold md:col-span-2">{label}{hint&&<span className="font-normal text-black/45"> — {hint}</span>}<textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} className={inputCls}/></label>;
}

export function VideoField({value,onChange}:{value:string;onChange:(v:string)=>void}){
  const video=parseVideoUrl(value);
  return <div className="md:col-span-2">
    <Field label="Video (YouTube, Vimeo o enlace .mp4)" type="url" inputMode="url" placeholder="https://youtu.be/…" value={value} onChange={e=>onChange(e.target.value)} wide/>
    {value&&!video&&<p className="mt-2 text-sm font-bold text-red-700">Enlace no reconocido. Usa un enlace https de YouTube, Vimeo o un archivo .mp4/.webm.</p>}
    {video&&<div className="mt-3 aspect-video max-w-md overflow-hidden rounded-2xl bg-black">{video.kind==="iframe"?<iframe src={video.src} title="Vista previa del video" className="h-full w-full" allowFullScreen/>:<video src={video.src} controls className="h-full w-full"/>}</div>}
  </div>;
}

export function Toggle({label,checked,onChange,hint}:{label:string;checked:boolean;onChange:(v:boolean)=>void;hint?:string}){
  return <label className="flex items-start gap-3 rounded-2xl bg-black/5 p-4 text-sm font-bold md:col-span-2"><input type="checkbox" className="mt-0.5 h-4 w-4" checked={checked} onChange={e=>onChange(e.target.checked)}/><span>{label}{hint&&<span className="block font-normal text-black/50">{hint}</span>}</span></label>;
}

/** Fotos elegidas antes de que exista la publicación: se suben justo después de crearla. */
export function PendingImages({files,onChange}:{files:File[];onChange:(f:File[])=>void}){
  const [error,setError]=useState("");
  const previews=useMemo(()=>files.map(f=>URL.createObjectURL(f)),[files]);
  useEffect(()=>()=>previews.forEach(u=>URL.revokeObjectURL(u)),[previews]);
  function add(list:FileList|null){
    if(!list)return;
    const ok:File[]=[];const errors:string[]=[];
    for(const f of list){const bad=checkFile(f);if(bad)errors.push(bad);else ok.push(f);}
    setError(errors.join(" · "));onChange([...files,...ok]);
  }
  const move=(from:number,to:number)=>{if(to<0||to>=files.length)return;const next=[...files];const [it]=next.splice(from,1);next.splice(to,0,it);onChange(next);};
  return <div className="md:col-span-2" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();add(e.dataTransfer.files);}}>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{files.map((f,i)=><div key={f.name+i} className={"overflow-hidden rounded-2xl bg-black/5 ring-2 "+(i===0?"ring-[#d9ff3f]":"ring-transparent")}>
      {/* Vista previa local (blob:) antes de subir: next/image no aplica. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {previews[i]&&<img src={previews[i]} alt="" className="aspect-square w-full object-cover"/>}
      <div className="flex gap-1 p-2 text-xs font-bold">
        <button type="button" onClick={()=>move(i,i-1)} disabled={i===0} className="rounded-lg bg-black/5 px-2 py-2 disabled:opacity-30" aria-label="Mover antes">←</button>
        <button type="button" onClick={()=>move(i,0)} className={"flex-1 rounded-lg px-2 py-2 "+(i===0?"bg-[#d9ff3f]":"bg-black/5")}>{i===0?"Portada":"Hacer portada"}</button>
        <button type="button" onClick={()=>move(i,i+1)} disabled={i===files.length-1} className="rounded-lg bg-black/5 px-2 py-2 disabled:opacity-30" aria-label="Mover después">→</button>
        <button type="button" onClick={()=>onChange(files.filter((_,n)=>n!==i))} className="rounded-lg bg-red-50 px-2 py-2 text-red-700" aria-label="Quitar">×</button>
      </div></div>)}
      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/15 text-center text-sm font-bold text-black/50 hover:bg-black/5">+ Añadir fotos<span className="mt-1 text-xs font-normal">o arrástralas aquí</span><input type="file" multiple accept={ACCEPT} className="hidden" onChange={e=>{add(e.target.files);e.target.value="";}}/></label>
    </div>
    {error&&<p className="mt-2 text-sm font-bold text-red-700">{error}</p>}
  </div>;
}

export type Check={label:string;ok:boolean;required?:boolean};
export function Checklist({items}:{items:Check[]}){
  const done=items.filter(i=>i.ok).length;
  return <div className="rounded-3xl bg-black p-6 text-white">
    <p className="text-xs font-black uppercase tracking-[.18em] text-[#d9ff3f]">Lista para publicar · {done}/{items.length}</p>
    <ul className="mt-4 space-y-2 text-sm">{items.map(i=><li key={i.label} className={i.ok?"text-white":"text-white/45"}>{i.ok?"✓":i.required?"✗":"○"} {i.label}{!i.ok&&i.required&&<span className="text-red-300"> (obligatorio)</span>}</li>)}</ul>
  </div>;
}
