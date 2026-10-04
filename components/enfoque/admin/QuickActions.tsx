"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

// Publicar/despublicar y destacar directamente desde el listado.
export function QuickActions({id,endpoint,status,featured}:{id:string;endpoint:string;status:string;featured:boolean}){
  const router=useRouter();
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  async function patch(body:Record<string,unknown>){
    setBusy(true);setError("");
    const r=await fetch(`${endpoint}/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({quick:true,...body})});
    const d=await r.json().catch(()=>({}));
    setBusy(false);
    if(!r.ok){setError(d.error||"Error");return;}
    router.refresh();
  }
  const published=status==="publicado";
  return <div className="flex flex-wrap items-center gap-2">
    <button type="button" disabled={busy} onClick={()=>patch({publication_status:published?"borrador":"publicado"})}
      className={"rounded-full px-3 py-2 text-xs font-black disabled:opacity-50 "+(published?"bg-black/5":"bg-[#d9ff3f]")}>{published?"Despublicar":"Publicar"}</button>
    <button type="button" disabled={busy} onClick={()=>patch({is_featured:!featured})} aria-pressed={featured}
      className={"rounded-full px-3 py-2 text-xs font-black disabled:opacity-50 "+(featured?"bg-black text-white":"bg-black/5")}>{featured?"★ Destacada":"☆ Destacar"}</button>
    {error&&<span className="text-xs font-bold text-red-700">{error}</span>}
  </div>;
}
