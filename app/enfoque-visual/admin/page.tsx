import Link from "next/link";
import {redirect} from "next/navigation";
import {adminTry,getAdminSession,isoDaysAgo} from "@/lib/enfoque-admin";
import type {EventRow,LeadRow} from "@/lib/enfoque-types";
import {AdminNav} from "@/components/enfoque/admin/AdminNav";
import {label} from "@/lib/enfoque-filters";

export const dynamic="force-dynamic";
const count=<T,>(rows:T[],k:keyof T,v:string)=>rows.filter(r=>r[k]===v).length;
type StatusRow={id:string;publication_status:string};

export default async function Admin(){
  const session=await getAdminSession();if(!session)redirect("/enfoque-visual/admin/login");
  const since=isoDaysAgo(30);
  const results=await Promise.all([
    adminTry<StatusRow[]>("properties?select=id,publication_status",session.token,[]),
    adminTry<StatusRow[]>("vehicles?select=id,publication_status",session.token,[]),
    adminTry<LeadRow[]>("leads?select=id,name,phone,email,status,created_at,properties(title,slug),vehicles(brand,model,year,slug)&order=created_at.desc&limit=200",session.token,[]),
    adminTry<EventRow[]>(`conversion_events?select=event_name,capi_status&occurred_at=gte.${since}`,session.token,[])
  ]);
  const [properties,vehicles,leads,events]=[results[0].data,results[1].data,results[2].data,results[3].data];
  const error=results.find(r=>r.error)?.error;
  const leads30=leads.filter(l=>l.created_at>=since).length;
  const cards:[string,string|number,string,string][]=[
    ["/enfoque-visual/admin/propiedades",count(properties,"publication_status","publicado"),"Propiedades publicadas",`${count(properties,"publication_status","borrador")} en borrador`],
    ["/enfoque-visual/admin/vehiculos",count(vehicles,"publication_status","publicado"),"Vehículos publicados",`${count(vehicles,"publication_status","borrador")} en borrador`],
    ["/enfoque-visual/admin/leads",count(leads,"status","nuevo"),"Leads nuevos sin atender",`${leads30} leads en 30 días`],
    ["/enfoque-visual/admin/leads#whatsapp",count(events,"event_name","Contact"),"Clics a WhatsApp (30 días)",`${events.filter(e=>e.capi_status==="fallido").length} envíos CAPI fallidos`],
  ];
  return <><AdminNav active="/enfoque-visual/admin" name={session.profile.full_name||undefined}/><main className="min-h-screen bg-[#f5f3ee] px-5 py-8"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.2em] text-black/40">Enfoque Visual</p><h1 className="ev-display mt-2 text-6xl font-black">Panel</h1></div>
      <div className="flex flex-wrap gap-2"><Link href="/enfoque-visual/admin/propiedades/nueva" className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white">+ Propiedad</Link><Link href="/enfoque-visual/admin/vehiculos/nuevo" className="rounded-full bg-black px-5 py-3 text-sm font-bold text-white">+ Vehículo</Link></div></div>
    {error&&<p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">No se pudo leer Supabase: {error.slice(0,200)} — revisa <Link className="underline" href="/enfoque-visual/admin/estado">Estado</Link>.</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{cards.map(([href,n,t,sub],i)=><Link key={t} href={href} className={"rounded-3xl p-6 ring-1 ring-black/5 "+(i===2?"bg-[#d9ff3f]":"bg-white")}><b className="text-4xl">{n}</b><p className="mt-2 font-bold">{t}</p><p className="text-sm text-black/50">{sub}</p></Link>)}</div>
    <section className="mt-8 rounded-3xl bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Últimos leads</h2><Link href="/enfoque-visual/admin/leads" className="text-sm font-bold underline">Ver todos</Link></div>
      <div className="mt-4 divide-y divide-black/5">{leads.slice(0,8).map(l=><div key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-bold">{l.name}</p><p className="text-sm text-black/50">{l.properties?.title||(l.vehicles?`${l.vehicles.brand} ${l.vehicles.model} ${l.vehicles.year}`:"Consulta general")} · {l.phone||l.email}</p></div><span className="rounded-full bg-black/5 px-3 py-1 text-xs font-black uppercase">{label(l.status)}</span></div>)}
      {!leads.length&&<p className="py-6 text-sm text-black/50">Todavía no hay leads.</p>}</div></section>
  </div></main></>;
}
