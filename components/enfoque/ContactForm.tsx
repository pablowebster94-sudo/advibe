"use client";
import {useState} from "react";
import {getMetaBrowserData,track} from "./Tracking";

const INTERESTS=["publicar_propiedad","publicar_vehiculo","comprar_propiedad","alquilar_propiedad","comprar_vehiculo","informacion_general"];

// Formulario general de contacto → Lead. El interés inicial llega de ?tipo= (desde /publicar).
export function ContactForm({initialInterest="informacion_general"}:{initialInterest?:string}){
  const interest=INTERESTS.includes(initialInterest)?initialInterest:"informacion_general";
  const empty={name:"",phone:"",email:"",interest_type:interest,message:"",website:""};
  const [form,setForm]=useState(empty);
  const [state,setState]=useState<"idle"|"sending"|"ok"|"error">("idle");
  const [error,setError]=useState("");
  async function submit(e:React.FormEvent){
    e.preventDefault(); setState("sending"); setError("");
    try{
      const eventId=crypto.randomUUID();
      const r=await fetch("/api/enfoque/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,channel:"formulario",event_id:eventId,event_source_url:location.href,...getMetaBrowserData()})});
      if(!r.ok){setError((await r.json().catch(()=>({}))).error||"");throw new Error();}
      track("Lead",{event_id:eventId,content_type:form.interest_type});
      setState("ok"); setForm(empty);
    }catch{setState("error");}
  }
  return <section className="rounded-[2rem] bg-black p-6 text-white md:p-8"><h2 className="text-2xl font-black">Solicitar información</h2><form onSubmit={submit} className="mt-6 space-y-4">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={form.website} onChange={e=>setForm({...form,website:e.target.value})} className="hidden"/>
      <label className="block text-sm font-bold">Nombre<input required autoComplete="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]"/></label>
      <label className="block text-sm font-bold">WhatsApp<input required type="tel" inputMode="tel" autoComplete="tel" placeholder="09XXXXXXXX" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]"/></label>
      <label className="block text-sm font-bold">Correo <span className="font-normal text-white/40">(opcional)</span><input type="email" autoComplete="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]"/></label>
      <label className="block text-sm font-bold">Me interesa<select value={form.interest_type} onChange={e=>setForm({...form,interest_type:e.target.value})} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none"><option value="publicar_propiedad" className="text-black">Publicar una propiedad</option><option value="publicar_vehiculo" className="text-black">Publicar un vehículo</option><option value="comprar_propiedad" className="text-black">Comprar una propiedad</option><option value="alquilar_propiedad" className="text-black">Buscar alquiler</option><option value="comprar_vehiculo" className="text-black">Comprar un vehículo</option><option value="informacion_general" className="text-black">Otro</option></select></label>
      <label className="block text-sm font-bold">Mensaje <span className="font-normal text-white/40">(opcional)</span><textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="mt-2 min-h-28 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]"/></label>
      <button disabled={state==="sending"} className="w-full rounded-full bg-[#d9ff3f] px-6 py-4 font-black text-black disabled:opacity-60">{state==="sending"?"Enviando…":"Enviar solicitud ↗"}</button>
      {state==="ok"&&<p className="text-sm text-[#d9ff3f]">Solicitud recibida. Te contactaremos pronto.</p>}{state==="error"&&<p className="text-sm text-red-300">{error||"No pudimos registrar la solicitud. Intenta nuevamente."}</p>}
    </form></section>;
}
