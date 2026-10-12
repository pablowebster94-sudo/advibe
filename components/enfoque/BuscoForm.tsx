"use client";
import {useState} from "react";
import {CONSENT_TEXT,SEARCH_CANTON,SEARCH_OPERATION,SEARCH_TIMEFRAME,SEARCH_WHAT} from "@/lib/enfoque-demand";
import {getMetaBrowserData,track} from "./Tracking";

export type BuscoInitial={what?:string;operation?:string;canton?:string};

// "Busco propiedad" → Lead interest_type=busco_propiedad (pixel + CAPI con el mismo event_id).
// La validación real está en el servidor (lib/enfoque-demand.ts); aquí solo se guía al usuario.
export function BuscoForm({initial={}}:{initial?:BuscoInitial}){
  const has=(list:ReadonlyArray<readonly [string,string]>,v?:string)=>list.some(([k])=>k===v)?v!:"";
  const empty={what:has(SEARCH_WHAT,initial.what),operation:has(SEARCH_OPERATION,initial.operation)||"comprar",canton:has(SEARCH_CANTON,initial.canton),canton_other:"",
    budget_max:"",from_abroad:false,country:"",timeframe:"",name:"",phone:"",email:"",notes:"",consent:false,website:""};
  const [form,setForm]=useState(empty);
  const [state,setState]=useState<"idle"|"sending"|"ok"|"error">("idle");
  const [error,setError]=useState("");
  const set=<K extends keyof typeof empty>(k:K,v:(typeof empty)[K])=>setForm(f=>({...f,[k]:v}));
  async function submit(e:React.FormEvent){
    e.preventDefault(); setState("sending"); setError("");
    try{
      const eventId=crypto.randomUUID();
      const r=await fetch("/api/enfoque/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        ...form,interest_type:"busco_propiedad",channel:"formulario",event_id:eventId,event_source_url:location.href,...getMetaBrowserData()
      })});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setError(d.error||"");throw new Error();}
      track("Lead",{event_id:eventId,content_type:"busco_propiedad"});
      setState("ok"); setForm(empty);
    }catch{setState("error");}
  }
  if(state==="ok")return <section className="rounded-[2rem] bg-[#d9ff3f] p-8 text-black"><h2 className="text-3xl font-black">¡Listo! Ya estás en nuestra lista.</h2><p className="mt-3 text-black/70">Te escribiremos por WhatsApp cuando tengamos opciones que coincidan con lo que buscas.</p><button type="button" onClick={()=>setState("idle")} className="mt-6 rounded-full bg-black px-6 py-3 text-sm font-black text-white">Registrar otra búsqueda</button></section>;
  const field="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]";
  const chip=(active:boolean)=>"cursor-pointer rounded-full px-4 py-2 text-sm font-bold ring-1 transition "+(active?"bg-[#d9ff3f] text-black ring-[#d9ff3f]":"ring-white/20 hover:ring-white/50");
  return <section className="rounded-[2rem] bg-black p-6 text-white md:p-8"><h2 className="text-2xl font-black">Cuéntanos qué buscas</h2>
    <form onSubmit={submit} className="mt-6 space-y-5">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={e=>set("website",e.target.value)} className="hidden"/>
      <fieldset><legend className="text-sm font-bold">¿Qué buscas?</legend><div className="mt-2 flex flex-wrap gap-2">
        {SEARCH_WHAT.map(([v,l])=><label key={v} className={chip(form.what===v)}><input type="radio" name="what" value={v} required checked={form.what===v} onChange={()=>set("what",v)} className="sr-only"/>{l}</label>)}</div></fieldset>
      <fieldset><legend className="text-sm font-bold">¿Quieres…?</legend><div className="mt-2 flex flex-wrap gap-2">
        {SEARCH_OPERATION.map(([v,l])=><label key={v} className={chip(form.operation===v)}><input type="radio" name="operation" value={v} required checked={form.operation===v} onChange={()=>set("operation",v)} className="sr-only"/>{l}</label>)}</div></fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">Cantón<select required value={form.canton} onChange={e=>set("canton",e.target.value)} className={field}><option value="" className="text-black">Elige…</option>{SEARCH_CANTON.map(([v,l])=><option key={v} value={v} className="text-black">{l}</option>)}</select></label>
        <label className="block text-sm font-bold">Presupuesto máximo (USD) <span className="font-normal text-white/40">(opcional)</span><input type="number" inputMode="numeric" min={0} step={1000} value={form.budget_max} onChange={e=>set("budget_max",e.target.value)} className={field}/></label>
      </div>
      {form.canton==="otro"&&<label className="block text-sm font-bold">¿Qué cantón o sector?<input maxLength={80} value={form.canton_other} onChange={e=>set("canton_other",e.target.value)} className={field}/></label>}
      <label className="flex items-center gap-3 text-sm font-bold"><input type="checkbox" checked={form.from_abroad} onChange={e=>set("from_abroad",e.target.checked)} className="h-5 w-5 accent-[#d9ff3f]"/>¿Compras desde el exterior?</label>
      {form.from_abroad&&<label className="block text-sm font-bold">¿Desde qué país?<input required maxLength={80} autoComplete="country-name" value={form.country} onChange={e=>set("country",e.target.value)} className={field}/></label>}
      <label className="block text-sm font-bold">¿Para cuándo? <span className="font-normal text-white/40">(opcional)</span><select value={form.timeframe} onChange={e=>set("timeframe",e.target.value)} className={field}><option value="" className="text-black">Elige…</option>{SEARCH_TIMEFRAME.map(([v,l])=><option key={v} value={v} className="text-black">{l}</option>)}</select></label>
      <label className="block text-sm font-bold">Detalles <span className="font-normal text-white/40">(opcional)</span><textarea maxLength={1000} rows={2} placeholder="Ej. 3 dormitorios, con patio, cerca del centro" value={form.notes} onChange={e=>set("notes",e.target.value)} className={field}/></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold">Nombre<input required minLength={2} autoComplete="name" value={form.name} onChange={e=>set("name",e.target.value)} className={field}/></label>
        <label className="block text-sm font-bold">WhatsApp<input required type="tel" inputMode="tel" autoComplete="tel" placeholder={form.from_abroad?"+1 555 123 4567":"09XXXXXXXX"} value={form.phone} onChange={e=>set("phone",e.target.value)} className={field}/></label>
      </div>
      <label className="block text-sm font-bold">Correo <span className="font-normal text-white/40">(opcional)</span><input type="email" autoComplete="email" value={form.email} onChange={e=>set("email",e.target.value)} className={field}/></label>
      <label className="flex gap-3 text-xs leading-5 text-white/70"><input type="checkbox" required checked={form.consent} onChange={e=>set("consent",e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#d9ff3f]"/><span>{CONSENT_TEXT}</span></label>
      <button disabled={state==="sending"} className="w-full rounded-full bg-[#d9ff3f] px-6 py-4 font-black text-black disabled:opacity-60">{state==="sending"?"Enviando…":"Avísame cuando haya opciones ↗"}</button>
      {state==="error"&&<p className="text-sm text-red-300">{error||"No pudimos registrar tu búsqueda. Intenta nuevamente o escríbenos por WhatsApp."}</p>}
    </form></section>;
}
