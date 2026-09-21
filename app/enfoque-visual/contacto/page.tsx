"use client";

import {useState} from "react";
import {Header} from "@/components/enfoque/Header";

export default function Contacto(){
  const [form,setForm]=useState({name:"",phone:"",email:"",interest_type:"publicar_propiedad",message:""});
  const [state,setState]=useState<"idle"|"sending"|"ok"|"error">("idle");
  async function submit(e:React.FormEvent){
    e.preventDefault(); setState("sending");
    try{
      const r=await fetch("/api/enfoque/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,channel:"formulario"})});
      if(!r.ok) throw new Error(); setState("ok");
      setForm({name:"",phone:"",email:"",interest_type:"publicar_propiedad",message:""});
    }catch{setState("error");}
  }
  return <><Header/><main className="mx-auto max-w-6xl px-5 py-14 md:py-20">
    <div className="grid gap-12 lg:grid-cols-[1fr_520px] lg:items-start">
      <section>
        <p className="text-xs font-black uppercase tracking-[.22em] text-black/40">Enfoque Visual · Contacto</p>
        <h1 className="ev-display mt-4 text-6xl font-black leading-[.9] md:text-8xl">Hablemos de lo que quieres publicar.</h1>
        <p className="mt-7 max-w-xl text-lg leading-8 text-black/60">¿Tienes una propiedad o vehículo? Déjanos tus datos y te contactaremos para revisar la publicación y el proceso de captación.</p>
        <div className="mt-10 rounded-3xl bg-[#d9ff3f] p-6"><p className="text-sm font-black uppercase tracking-[.18em]">Enfoque Visual × AdVibe</p><p className="mt-3 text-2xl font-black">Contenido + publicación + captación medible.</p></div>
      </section>
      <section className="rounded-[2rem] bg-black p-6 text-white md:p-8">
        <h2 className="text-2xl font-black">Solicitar información</h2>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold">Nombre<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]" /></label>
          <label className="block text-sm font-bold">WhatsApp<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]" /></label>
          <label className="block text-sm font-bold">Correo <span className="font-normal text-white/40">(opcional)</span><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]" /></label>
          <label className="block text-sm font-bold">Me interesa<select value={form.interest_type} onChange={e=>setForm({...form,interest_type:e.target.value})} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none"><option value="publicar_propiedad" className="text-black">Publicar una propiedad</option><option value="publicar_vehiculo" className="text-black">Publicar un vehículo</option><option value="comprar_propiedad" className="text-black">Comprar una propiedad</option><option value="comprar_vehiculo" className="text-black">Comprar un vehículo</option><option value="alquiler" className="text-black">Buscar alquiler</option><option value="otro" className="text-black">Otro</option></select></label>
          <label className="block text-sm font-bold">Mensaje <span className="font-normal text-white/40">(opcional)</span><textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} className="mt-2 min-h-28 w-full rounded-2xl bg-white/10 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-[#d9ff3f]" /></label>
          <button disabled={state==="sending"} className="w-full rounded-full bg-[#d9ff3f] px-6 py-4 font-black text-black disabled:opacity-60">{state==="sending"?"Enviando…":"Enviar solicitud ↗"}</button>
          {state==="ok"&&<p className="text-sm text-[#d9ff3f]">Solicitud recibida. Te contactaremos pronto.</p>}
          {state==="error"&&<p className="text-sm text-red-300">No pudimos registrar la solicitud. Intenta nuevamente.</p>}
        </form>
      </section>
    </div>
  </main></>;
}
