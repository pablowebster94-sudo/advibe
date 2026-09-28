"use client";
import {useState} from "react";
import {contentType,getMetaBrowserData,track} from "./Tracking";

type Props={id:string;type:"property"|"vehicle";value:number;interest:"comprar_propiedad"|"alquilar_propiedad"|"comprar_vehiculo";title:string};

// Formulario corto dentro de cada ficha → evento Lead (pixel + CAPI con el mismo event_id).
export function LeadForm({id,type,value,interest,title}:Props){
  const empty={name:"",phone:"",email:"",message:"",website:""};
  const [form,setForm]=useState(empty);
  const [state,setState]=useState<"idle"|"sending"|"ok"|"error">("idle");
  const [error,setError]=useState("");
  async function submit(e:React.FormEvent){
    e.preventDefault(); setState("sending"); setError("");
    try{
      const eventId=crypto.randomUUID();
      const r=await fetch("/api/enfoque/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        ...form,message:form.message||"Solicito información sobre: "+title,interest_type:interest,channel:"formulario",
        property_id:type==="property"?id:undefined,vehicle_id:type==="vehicle"?id:undefined,value,
        event_id:eventId,event_source_url:location.href,...getMetaBrowserData()
      })});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setError(d.error||"");throw new Error();}
      track("Lead",{event_id:eventId,content_ids:[id],content_type:contentType(type),value,currency:"USD"});
      setState("ok"); setForm(empty);
    }catch{setState("error");}
  }
  if(state==="ok")return <div className="rounded-2xl bg-[#d9ff3f] p-5 text-black"><p className="font-black">¡Solicitud recibida!</p><p className="mt-1 text-sm text-black/70">Te contactaremos pronto con la información.</p></div>;
  const input="mt-1 w-full rounded-xl bg-white/10 px-4 py-3 text-sm text-white outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]";
  return <form onSubmit={submit} className="space-y-3">
    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className="hidden"/>
    <label className="block text-xs font-bold text-white/70">Nombre<input required minLength={2} autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={input}/></label>
    <label className="block text-xs font-bold text-white/70">WhatsApp<input required type="tel" inputMode="tel" autoComplete="tel" placeholder="09XXXXXXXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={input}/></label>
    <label className="block text-xs font-bold text-white/70">Correo <span className="font-normal text-white/40">(opcional)</span><input type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={input}/></label>
    <label className="block text-xs font-bold text-white/70">Mensaje <span className="font-normal text-white/40">(opcional)</span><textarea rows={2} value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className={input}/></label>
    <button disabled={state==="sending"} className="w-full rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:scale-[1.01] disabled:opacity-60">{state==="sending"?"Enviando…":"Solicitar información"}</button>
    {state==="error"&&<p className="text-xs text-red-300">{error||"No pudimos registrar la solicitud. Intenta nuevamente o escríbenos por WhatsApp."}</p>}
    <p className="text-[11px] leading-4 text-white/40">Al enviar aceptas que te contactemos sobre esta publicación.</p>
  </form>;
}
