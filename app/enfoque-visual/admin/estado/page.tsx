import Link from "next/link";
import {redirect} from "next/navigation";
import {adminGet,getAdminSession} from "@/lib/enfoque-admin";
import {runHealthChecks} from "@/lib/enfoque-health";
import {CapiTest} from "./CapiTest";

export const dynamic="force-dynamic";
const color={ok:"bg-[#d9ff3f]",warn:"bg-amber-200",error:"bg-red-200"};
const icon={ok:"✓",warn:"!",error:"✗"};

export default async function Estado(){
  const s=await getAdminSession();if(!s)redirect("/enfoque-visual/admin/login");
  const [checks,events]=await Promise.all([
    runHealthChecks(),
    adminGet<any[]>("conversion_events?select=event_name,capi_status,capi_last_error,occurred_at&order=occurred_at.desc&limit=20",s.token).catch(()=>[])
  ]);
  const errors=checks.filter(c=>c.status==="error").length;
  return <main className="min-h-screen bg-[#f5f3ee] px-5 py-10"><div className="mx-auto max-w-5xl">
    <Link href="/enfoque-visual/admin" className="text-sm font-bold underline">← Panel</Link>
    <h1 className="ev-display mt-5 text-5xl font-black">Estado de producción</h1>
    <p className="mt-2 text-black/55">{errors?`${errors} punto(s) bloquean la captación.`:"Configuración completa."} Esta página no muestra secretos.</p>
    <div className="mt-8 space-y-3">{checks.map(c=><div key={c.id} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-black/5">
      <span className={"flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black "+color[c.status]}>{icon[c.status]}</span>
      <div><p className="font-black">{c.label}</p><p className="text-sm text-black/60">{c.detail}</p></div></div>)}</div>
    <CapiTest/>
    <section className="mt-8 rounded-3xl bg-white p-6"><h2 className="text-2xl font-black">Últimos eventos de conversión</h2>
      <p className="mt-1 text-sm text-black/50">Contact = clic en WhatsApp · Lead = formulario. “enviado” = Meta CAPI respondió OK.</p>
      {events.length?<div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-black/10"><th className="p-2">Fecha</th><th className="p-2">Evento</th><th className="p-2">CAPI</th><th className="p-2">Error</th></tr></thead>
      <tbody>{events.map((e,i)=><tr key={i} className="border-b border-black/5"><td className="p-2 whitespace-nowrap">{new Date(e.occurred_at).toLocaleString("es-EC",{timeZone:"America/Guayaquil"})}</td><td className="p-2 font-bold">{e.event_name}</td><td className="p-2">{e.capi_status}</td><td className="p-2 text-xs text-red-700">{e.capi_last_error||""}</td></tr>)}</tbody></table></div>
      :<p className="mt-4 text-sm text-black/50">Todavía no hay eventos registrados.</p>}
    </section>
  </div></main>;
}
