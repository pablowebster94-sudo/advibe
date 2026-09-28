"use client";
import {useState} from "react";

export function CapiTest(){
  const [code,setCode]=useState("");
  const [msg,setMsg]=useState("");
  async function send(e:React.FormEvent){
    e.preventDefault();setMsg("Enviando…");
    const r=await fetch("/api/enfoque/admin/health",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({test_event_code:code})});
    const d=await r.json().catch(()=>({}));
    setMsg(r.ok?"Meta aceptó el evento. Revísalo en Administrador de eventos → Probar eventos.":d.error||(d.reason==="not_configured"?"CAPI no está configurado.":`Meta respondió ${d.status??"error"}: ${d.body||d.reason||""}`));
  }
  return <section className="mt-8 rounded-3xl bg-black p-6 text-white"><h2 className="text-2xl font-black">Probar Meta CAPI</h2>
    <p className="mt-1 text-sm text-white/60">En Administrador de eventos → tu dataset → “Probar eventos”, copia el código TEST… y envía un Lead de prueba desde el servidor.</p>
    <form onSubmit={send} className="mt-4 flex flex-wrap gap-3"><input required value={code} onChange={e=>setCode(e.target.value)} placeholder="TEST12345" className="min-w-0 flex-1 rounded-full bg-white/10 px-5 py-3 text-sm outline-none ring-1 ring-white/15 focus:ring-[#d9ff3f]"/><button className="rounded-full bg-[#d9ff3f] px-6 py-3 text-sm font-black text-black">Enviar evento de prueba</button></form>
    {msg&&<p className="mt-3 text-sm" role="status">{msg}</p>}
  </section>;
}
