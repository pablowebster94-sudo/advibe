"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

// Cuando alguien escribe por WhatsApp con "(Ref: EV-XXXXXX)", se registra aquí como lead.
export function WhatsAppLeadForm({initialRef=""}:{initialRef?:string}){
  const router=useRouter();
  const [f,setF]=useState({ref_code:initialRef,name:"",phone:"",message:""});
  const [msg,setMsg]=useState("");const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg("");
    const r=await fetch("/api/enfoque/admin/leads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(f)});
    const d=await r.json().catch(()=>({}));setBusy(false);
    if(!r.ok){setMsg(d.error||"No se pudo registrar.");return;}
    setMsg("Lead registrado.");setF({ref_code:"",name:"",phone:"",message:""});router.refresh();
  }
  const input="rounded-xl bg-black/5 p-3 text-sm";
  return <form onSubmit={submit} className="grid gap-3 md:grid-cols-[150px_1fr_1fr_auto]">
    <input aria-label="Referencia" placeholder="EV-XXXXXX" value={f.ref_code} onChange={e=>setF({...f,ref_code:e.target.value.toUpperCase()})} className={input+" font-mono"}/>
    <input aria-label="Nombre" required placeholder="Nombre" value={f.name} onChange={e=>setF({...f,name:e.target.value})} className={input}/>
    <input aria-label="WhatsApp" required type="tel" placeholder="0991234567" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})} className={input}/>
    <button disabled={busy} className="rounded-full bg-black px-5 py-3 text-sm font-black text-white disabled:opacity-60">{busy?"Guardando…":"Registrar lead"}</button>
    {msg&&<p className="text-sm font-bold md:col-span-4" role="status">{msg}</p>}
  </form>;
}
