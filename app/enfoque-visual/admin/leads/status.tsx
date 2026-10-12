"use client";
import {useState} from "react";
import {label} from "@/lib/enfoque-filters";
import {LEAD_STATUSES as STATUSES} from "@/lib/enfoque-leads-filter";


export function LeadStatus({id,initial}:{id:string;initial:string}){
  const [status,setStatus]=useState(initial);
  const [error,setError]=useState(false);
  async function change(v:string){
    const prev=status;setStatus(v);setError(false);
    const r=await fetch("/api/enfoque/admin/leads/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:v})}).catch(()=>null);
    if(!r?.ok){setStatus(prev);setError(true);}
  }
  return <span className="inline-flex items-center gap-1"><select aria-label="Estado del lead" value={status} onChange={e=>change(e.target.value)} className="rounded-lg bg-black/5 px-2 py-2 text-xs font-bold">{STATUSES.map(s=><option key={s} value={s}>{label(s==="visita_agendada"?"Visita agendada":s==="negociacion"?"Negociación":s)}</option>)}</select>{error&&<span className="text-xs font-bold text-red-700">No se guardó</span>}</span>;
}

export function LeadNotes({id,initial}:{id:string;initial:string}){
  const [notes,setNotes]=useState(initial);
  const [state,setState]=useState<""|"saving"|"ok"|"error">("");
  async function save(){
    if(notes===initial&&state==="")return;
    setState("saving");
    const r=await fetch("/api/enfoque/admin/leads/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({notes})}).catch(()=>null);
    setState(r?.ok?"ok":"error");
  }
  return <div><textarea aria-label="Notas" rows={2} value={notes} onChange={e=>{setNotes(e.target.value);setState("");}} onBlur={save} placeholder="Notas internas…" className="w-full rounded-lg bg-black/5 p-2 text-xs"/>{state==="ok"&&<span className="text-[11px] text-black/40">Guardado</span>}{state==="error"&&<span className="text-[11px] font-bold text-red-700">No se guardó</span>}</div>;
}
