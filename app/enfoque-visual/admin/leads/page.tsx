import Link from "next/link";
import {redirect} from "next/navigation";
import {adminTry,getAdminSession} from "@/lib/enfoque-admin";
import type {EventRow,LeadRow} from "@/lib/enfoque-types";
import {label} from "@/lib/enfoque-filters";
import {AdminNav} from "@/components/enfoque/admin/AdminNav";
import {LeadNotes,LeadStatus} from "./status";
import {WhatsAppLeadForm} from "./WhatsAppLeadForm";

export const dynamic="force-dynamic";
const STATUSES=["nuevo","contactado","calificado","visita_agendada","negociacion","cerrado","descartado"];
const fmt=(d:string)=>new Date(d).toLocaleString("es-EC",{timeZone:"America/Guayaquil",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
const listing=(x:Pick<LeadRow,"properties"|"vehicles">)=>x.properties?{name:x.properties.title,href:"/enfoque-visual/propiedades/"+x.properties.slug}:x.vehicles?{name:`${x.vehicles.brand} ${x.vehicles.model} ${x.vehicles.year}`,href:"/enfoque-visual/vehiculos/"+x.vehicles.slug}:null;
const wa=(phone:string)=>"https://wa.me/"+phone.replace(/\D/g,"");

export default async function Leads({searchParams}:{searchParams:Promise<{estado?:string}>}){
  const s=await getAdminSession();if(!s)redirect("/enfoque-visual/admin/login");
  const estado=(await searchParams).estado||"";
  const filter=STATUSES.includes(estado)?estado:"";
  const [{data:leads,error},{data:contacts}]=await Promise.all([
    adminTry<LeadRow[]>(`leads?select=id,name,phone,email,status,channel,interest_type,message,notes,ref_code,utm_source,utm_campaign,fbclid,gclid,created_at,properties(title,slug),vehicles(brand,model,year,slug)&order=created_at.desc&limit=200${filter?`&status=eq.${filter}`:""}`,s.token,[]),
    adminTry<EventRow[]>("conversion_events?select=id,ref_code,lead_id,utm_campaign,occurred_at,capi_status,properties(title,slug),vehicles(brand,model,year,slug)&event_name=eq.Contact&order=occurred_at.desc&limit=50",s.token,[])
  ]);
  return <><AdminNav active="/enfoque-visual/admin/leads" name={s.profile.full_name||undefined}/><main className="min-h-screen bg-[#f5f3ee] px-5 py-8"><div className="mx-auto max-w-7xl">
    <h1 className="ev-display text-5xl font-black">Leads</h1>
    {error&&<p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">No se pudo leer Supabase: {error.slice(0,200)}</p>}
    <div className="mt-6 flex flex-wrap gap-2">{[["","Todos"],...STATUSES.map(x=>[x,label(x==="visita_agendada"?"Visita agendada":x==="negociacion"?"Negociación":x)])].map(([v,l])=><Link key={v} href={v?`/enfoque-visual/admin/leads?estado=${v}`:"/enfoque-visual/admin/leads"} className={"rounded-full px-4 py-2 text-sm font-bold "+(filter===v?"bg-black text-white":"bg-white ring-1 ring-black/10")}>{l}</Link>)}</div>
    <div className="mt-4 overflow-x-auto rounded-3xl bg-white p-2"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-black/10 text-xs uppercase text-black/45"><th className="p-3">Fecha</th><th className="p-3">Contacto</th><th className="p-3">Interés</th><th className="p-3">Origen</th><th className="p-3">Estado</th><th className="p-3 w-64">Notas</th></tr></thead>
      <tbody>{leads.map(l=>{const item=listing(l);return <tr key={l.id} className="border-b border-black/5 align-top">
        <td className="p-3 whitespace-nowrap text-black/60">{fmt(l.created_at)}</td>
        <td className="p-3"><p className="font-bold">{l.name}</p>{l.phone&&<a href={wa(l.phone)} target="_blank" className="block text-xs underline">{l.phone}</a>}{l.email&&<a href={"mailto:"+l.email} className="block text-xs underline">{l.email}</a>}</td>
        <td className="p-3">{item?<Link href={item.href} target="_blank" className="font-bold underline">{item.name}</Link>:<span>{label(String(l.interest_type).replace(/_/g," "))}</span>}{l.message&&<p className="mt-1 max-w-xs text-xs text-black/55">{l.message}</p>}</td>
        <td className="p-3 text-xs"><p className="font-bold">{l.channel==="whatsapp"?"WhatsApp":"Formulario"}{l.ref_code?` · ${l.ref_code}`:""}</p><p className="text-black/50">{l.utm_campaign||l.utm_source||(l.fbclid?"Meta (fbclid)":l.gclid?"Google (gclid)":"Directo/orgánico")}</p></td>
        <td className="p-3"><LeadStatus id={l.id} initial={l.status}/></td>
        <td className="p-3"><LeadNotes id={l.id} initial={l.notes||""}/></td>
      </tr>;})}</tbody></table>
      {!leads.length&&<p className="p-8 text-center text-sm text-black/50">No hay leads en esta vista.</p>}</div>

    <section id="whatsapp" className="mt-10 scroll-mt-20 rounded-3xl bg-white p-6">
      <h2 className="text-2xl font-black">Clics a WhatsApp</h2>
      <p className="mt-1 text-sm text-black/55">Cada mensaje llega con “(Ref: EV-XXXXXX)”. Busca la referencia aquí para saber de qué publicación y campaña viene, y regístralo como lead.</p>
      <div className="mt-5"><WhatsAppLeadForm/></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-black/10 text-xs uppercase text-black/45"><th className="p-2">Fecha</th><th className="p-2">Referencia</th><th className="p-2">Publicación</th><th className="p-2">Campaña</th><th className="p-2">Lead</th></tr></thead>
        <tbody>{contacts.map(c=>{const item=listing(c);return <tr key={c.id} className="border-b border-black/5"><td className="p-2 whitespace-nowrap text-black/60">{fmt(c.occurred_at)}</td><td className="p-2 font-mono font-bold">{c.ref_code||"—"}</td><td className="p-2">{item?<Link href={item.href} target="_blank" className="underline">{item.name}</Link>:"General"}</td><td className="p-2">{c.utm_campaign||"—"}</td><td className="p-2">{c.lead_id?"✓ registrado":"—"}</td></tr>;})}</tbody></table>
        {!contacts.length&&<p className="p-6 text-center text-sm text-black/50">Todavía no hay clics a WhatsApp.</p>}</div>
    </section>
  </div></main></>;
}
