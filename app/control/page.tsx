'use client';

import { useEffect, useMemo, useState } from "react";

type Client = { id:string; name:string; monthly:number; day:number|string; status:string; production:number; notes?:string };
type Charge = { id:string; clientId:string; period:string; amount:number; paid:number; due:string };
type Production = { id:string; clientId:string; title:string; type:string; status:string; due:string; recordDate?:string; publishDate?:string };

const initialClients:Client[] = [
  {id:"CLI-0001",name:"Kamauto",monthly:200,day:2,status:"ACTIVO",production:8,notes:"Próximo pago: $200 el 2 de noviembre de 2026."},
  {id:"CLI-0002",name:"Muebles Ideal",monthly:200,day:"15 y 30",status:"ACTIVO",production:8,notes:"Octubre: $100 el 15 y $100 el 30."},
  {id:"CLI-0003",name:"Paola Miguitama",monthly:100,day:5,status:"ACTIVO",production:5,notes:"Octubre: abonó $50; falta cobrar $50."},
  {id:"CLI-0004",name:"Club Santa Bárbara",monthly:200,day:"9/10",status:"ACTIVO",production:5,notes:"Pendiente entregar contenido. Ya pagó $100; faltan $50 de SB Cuenca y $50 de SB Gualaceo."},
  {id:"CLI-0005",name:"AM Motorsport",monthly:150,day:14,status:"ACTIVO",production:0,notes:"Cobro de octubre: 14 de octubre de 2026."},
  {id:"CLI-0006",name:"CETAD San Lucas",monthly:150,day:"Por definir",status:"ACTIVO",production:0,notes:"Octubre: abonó $75; falta cobrar $75."},
  {id:"CLI-0007",name:"Roxis Joyería",monthly:150,day:28,status:"ACTIVO",production:0,notes:"Octubre: abonó $75; falta cobrar $75."},
];
const initialCharges:Charge[] = [
  {id:"COB-2026-11-01",clientId:"CLI-0001",period:"2026-11",amount:200,paid:0,due:"2026-11-02"},
  {id:"COB-2026-10-02A",clientId:"CLI-0002",period:"2026-10",amount:100,paid:0,due:"2026-10-15"},
  {id:"COB-2026-10-02B",clientId:"CLI-0002",period:"2026-10",amount:100,paid:0,due:"2026-10-30"},
  {id:"COB-2026-10-03",clientId:"CLI-0003",period:"2026-10",amount:100,paid:50,due:"2026-10-05"},
  {id:"COB-2026-10-04A",clientId:"CLI-0004",period:"2026-10",amount:100,paid:50,due:"2026-10-09"},
  {id:"COB-2026-10-04B",clientId:"CLI-0004",period:"2026-10",amount:100,paid:50,due:"2026-10-10"},
  {id:"COB-2026-10-06",clientId:"CLI-0006",period:"2026-10",amount:150,paid:75,due:"Por definir"},
  {id:"COB-2026-10-05",clientId:"CLI-0005",period:"2026-10",amount:150,paid:0,due:"2026-10-14"},
  {id:"COB-2026-10-07",clientId:"CLI-0007",period:"2026-10",amount:150,paid:75,due:"2026-10-28"},
];
const initialProduction:Production[] = [
  {id:"PRD-0001",clientId:"CLI-0001",title:"Kamauto — Reel #1",type:"REEL",status:"PUBLICADO",due:"2026-09-02",publishDate:"2026-09-02"},
  {id:"PRD-0002",clientId:"CLI-0001",title:"Kamauto — Reel #2",type:"REEL",status:"PENDIENTE",due:"2026-09-10",recordDate:"2026-10-15",publishDate:"2026-10-18"},
];
const money = (n:number) => new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:2}).format(n);
const today = () => new Date().toLocaleDateString("en-CA");

export default function ControlPage(){
  const [tab,setTab] = useState("Inicio");
  const [clients,setClients] = useState<Client[]>(initialClients);
  const [charges,setCharges] = useState<Charge[]>(initialCharges);
  const [production,setProduction] = useState<Production[]>(initialProduction);
  const [ready,setReady] = useState(false);
  const [showClient,setShowClient] = useState(false);
  const [showContent,setShowContent] = useState(false);
  const [clientNameInput,setClientNameInput] = useState("");
  const [monthlyInput,setMonthlyInput] = useState("150");
  const [dayInput,setDayInput] = useState("1");
  const [contentClient,setContentClient] = useState("");
  const [contentTitle,setContentTitle] = useState("");
  const [recordDate,setRecordDate] = useState("");
  const [publishDate,setPublishDate] = useState("");

  useEffect(()=>{
    try {
      const saved=localStorage.getItem("advibe-control-v2");
      if(saved){const x=JSON.parse(saved); if(x.clients)setClients(x.clients);if(x.charges)setCharges(x.charges);if(x.production)setProduction(x.production);}
    } catch {}
    setReady(true);
  },[]);
  useEffect(()=>{if(ready)localStorage.setItem("advibe-control-v2",JSON.stringify({clients,charges,production,tasks:[]}));},[clients,charges,production,ready]);

  const pending=useMemo(()=>charges.reduce((s,c)=>s+Math.max(0,c.amount-c.paid),0),[charges]);
  const collected=useMemo(()=>charges.reduce((s,c)=>s+c.paid,0),[charges]);
  const pendingContent=production.filter(p=>p.status!=="PUBLICADO").length;
  const nameFor=(id:string)=>clients.find(c=>c.id===id)?.name||"Cliente";
  const addClient=()=>{
    if(!clientNameInput.trim())return;
    const id="CLI-"+String(Date.now()).slice(-6);
    setClients(old=>[...old,{id,name:clientNameInput.trim(),monthly:Number(monthlyInput)||0,day:Number(dayInput)||1,status:"ACTIVO",production:0}]);
    setClientNameInput("");setMonthlyInput("150");setDayInput("1");setShowClient(false);
  };
  const addContent=()=>{
    if(!contentClient||!contentTitle.trim())return;
    setProduction(old=>[...old,{id:"PRD-"+String(Date.now()).slice(-6),clientId:contentClient,title:contentTitle.trim(),type:"REEL",status:"PENDIENTE",due:publishDate||recordDate||today(),recordDate:recordDate||undefined,publishDate:publishDate||undefined}]);
    setContentTitle("");setRecordDate("");setPublishDate("");setShowContent(false);setTab("Contenido");
  };
  const registerPayment=(charge:Charge)=>{
    const remaining=charge.amount-charge.paid;
    const input=prompt(`Saldo de ${nameFor(charge.clientId)}: ${money(remaining)}\n¿Cuánto pagó?`,String(remaining));
    if(input===null)return;
    const amount=Number(input);
    if(!Number.isFinite(amount)||amount<=0||amount>remaining){alert("Ingresa un abono mayor que 0 y no superior al saldo.");return;}
    setCharges(old=>old.map(c=>c.id===charge.id?{...c,paid:c.paid+amount}:c));
  };
  const nav=["Inicio","Clientes","Contenido","Cobros","Agenda"];

  return <main className="min-h-screen bg-slate-50 text-slate-900 pb-24">
    <header className="bg-slate-950 text-white px-5 py-5">
      <div className="mx-auto max-w-3xl flex items-center justify-between">
        <div><p className="text-xl font-black">Ad<span className="text-blue-400">Vibe</span> Control</p><p className="text-xs text-slate-400 mt-1">Clientes y contenido, sin complicaciones</p></div>
        <span className="rounded-full bg-emerald-500/15 text-emerald-300 px-3 py-1 text-xs">● En orden</span>
      </div>
    </header>
    <div className="mx-auto max-w-3xl p-4 space-y-5">
      {tab==="Inicio"&&<>
        <section className="rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 p-5 text-white"><p className="text-sm text-blue-100">Resumen rápido</p><h1 className="text-2xl font-black mt-1">Hola, AdVibe 👋</h1><p className="text-sm mt-2 text-blue-100">Aquí tienes lo importante para hoy.</p></section>
        <div className="grid grid-cols-2 gap-3"><Metric title="Por cobrar" value={money(pending)} hint="Saldo pendiente"/><Metric title="Cobrado" value={money(collected)} hint="Pagos registrados"/><Metric title="Contenido pendiente" value={String(pendingContent)} hint="Piezas por publicar"/><Metric title="Clientes" value={String(clients.length)} hint="En tu cartera"/></div>
        <section className="rounded-2xl border bg-white p-4"><h2 className="font-black mb-3">Accesos rápidos</h2><div className="grid grid-cols-2 gap-3"><Action onClick={()=>setShowClient(true)} label="+ Nuevo cliente"/><Action onClick={()=>setShowContent(true)} label="+ Nuevo contenido"/></div></section>
        <section className="rounded-2xl border bg-white p-4"><h2 className="font-black mb-3">Pendiente de cobro</h2>{charges.filter(c=>c.paid<c.amount).slice(0,4).map(c=><div key={c.id} className="flex items-center justify-between gap-3 border-t py-3"><div><p className="font-bold text-sm">{nameFor(c.clientId)}</p><p className="text-xs text-slate-500">Debe {money(c.amount-c.paid)}</p></div><button onClick={()=>registerPayment(c)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">Registrar pago</button></div>)}{charges.every(c=>c.paid>=c.amount)&&<p className="text-sm text-slate-500">No hay cobros pendientes.</p>}</section>
      </>}
      {tab==="Clientes"&&<><PageTitle title="Clientes" action="+ Agregar" onClick={()=>setShowClient(true)}/>{clients.map(c=><article key={c.id} className="rounded-2xl border bg-white p-4 mb-3"><div className="flex items-start justify-between gap-3"><div><h2 className="font-black">{c.name}</h2><p className="text-xs text-slate-500 mt-1">Pago: día {c.day}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${c.status==="ACTIVO"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{c.status==="ACTIVO"?"ACTIVO":"POR CONFIRMAR"}</span></div><p className="text-xl font-black mt-3">{money(c.monthly)} <span className="text-xs font-normal text-slate-500">/ mes</span></p>{c.notes&&<p className="text-xs text-slate-500 mt-2">{c.notes}</p>}</article>)}</>}
      {tab==="Contenido"&&<><PageTitle title="Contenido" action="+ Nueva pieza" onClick={()=>setShowContent(true)}/>{production.map(p=><article key={p.id} className="rounded-2xl border bg-white p-4 mb-3"><div className="flex justify-between gap-3"><div><h2 className="font-bold">{p.title}</h2><p className="text-xs text-slate-500 mt-1">{nameFor(p.clientId)}</p></div><span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${p.status==="PUBLICADO"?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{p.status==="PUBLICADO"?"PUBLICADO":"PENDIENTE"}</span></div><div className="grid grid-cols-2 gap-2 mt-4 text-sm"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Grabación</p><p className="font-semibold">{p.recordDate||"Sin fecha"}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Publicación</p><p className="font-semibold">{p.publishDate||p.due||"Sin fecha"}</p></div></div><button onClick={()=>setProduction(old=>old.map(x=>x.id===p.id?{...x,status:x.status==="PUBLICADO"?"PENDIENTE":"PUBLICADO"}:x))} className="mt-3 w-full rounded-xl border px-3 py-2 text-sm font-bold">{p.status==="PUBLICADO"?"Marcar pendiente":"Marcar como publicado"}</button></article>)}</>}
      {tab==="Cobros"&&<><PageTitle title="Cobros" subtitle="Registra los pagos y revisa saldos."/><div className="grid grid-cols-2 gap-3 mb-4"><Metric title="Pendiente" value={money(pending)} hint="Por recibir"/><Metric title="Cobrado" value={money(collected)} hint="Ya recibido"/></div>{charges.map(c=><article key={c.id} className="rounded-2xl border bg-white p-4 mb-3 flex items-center justify-between gap-3"><div><h2 className="font-bold">{nameFor(c.clientId)}</h2><p className="text-xs text-slate-500 mt-1">{c.period} · vence {c.due}</p><p className="text-sm mt-2">Total {money(c.amount)} · Pagado {money(c.paid)}</p><p className={`font-black mt-1 ${c.paid>=c.amount?"text-emerald-700":"text-amber-700"}`}>{c.paid>=c.amount?"Pagado":`Saldo: ${money(c.amount-c.paid)}`}</p></div>{c.paid<c.amount&&<button onClick={()=>registerPayment(c)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">Abonar</button>}</article>)}</>}
      {tab==="Agenda"&&<><PageTitle title="Agenda" subtitle="Tus próximas grabaciones y publicaciones."/><section className="rounded-2xl border bg-white p-4"><h2 className="font-black mb-3">Grabaciones</h2>{production.filter(p=>p.recordDate).sort((a,b)=>(a.recordDate||"").localeCompare(b.recordDate||"")).map(p=><AgendaRow key={p.id} title={p.title} client={nameFor(p.clientId)} date={p.recordDate!}/>) }{production.every(p=>!p.recordDate)&&<p className="text-sm text-slate-500">Aún no has programado grabaciones.</p>}</section><section className="rounded-2xl border bg-white p-4"><h2 className="font-black mb-3">Publicaciones</h2>{production.filter(p=>p.publishDate&&p.status!=="PUBLICADO").sort((a,b)=>(a.publishDate||"").localeCompare(b.publishDate||"")).map(p=><AgendaRow key={p.id} title={p.title} client={nameFor(p.clientId)} date={p.publishDate!}/>) }{production.every(p=>!p.publishDate||p.status==="PUBLICADO")&&<p className="text-sm text-slate-500">No hay publicaciones programadas.</p>}</section></>}
    </div>
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t bg-white/95 backdrop-blur"><div className="mx-auto max-w-3xl grid grid-cols-5 p-2">{nav.map(n=><button key={n} onClick={()=>setTab(n)} className={`rounded-xl px-1 py-3 text-[11px] font-bold ${tab===n?"bg-blue-600 text-white":"text-slate-500"}`}>{n}</button>)}</div></nav>
    {showClient&&<Modal title="Nuevo cliente" onClose={()=>setShowClient(false)}><label className="block text-sm font-semibold mb-1">Nombre</label><input value={clientNameInput} onChange={e=>setClientNameInput(e.target.value)} placeholder="Nombre del cliente" className="w-full rounded-xl border p-3 mb-3"/><label className="block text-sm font-semibold mb-1">Mensualidad (USD)</label><input type="number" min="0" value={monthlyInput} onChange={e=>setMonthlyInput(e.target.value)} className="w-full rounded-xl border p-3 mb-3"/><label className="block text-sm font-semibold mb-1">Día de pago</label><input type="number" min="1" max="31" value={dayInput} onChange={e=>setDayInput(e.target.value)} className="w-full rounded-xl border p-3 mb-4"/><button onClick={addClient} className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white">Guardar cliente</button></Modal>}
    {showContent&&<Modal title="Nuevo contenido" onClose={()=>setShowContent(false)}><label className="block text-sm font-semibold mb-1">Cliente</label><select value={contentClient} onChange={e=>setContentClient(e.target.value)} className="w-full rounded-xl border p-3 mb-3"><option value="">Selecciona un cliente</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><label className="block text-sm font-semibold mb-1">Contenido a realizar</label><input value={contentTitle} onChange={e=>setContentTitle(e.target.value)} placeholder="Ej. Reel promoción de octubre" className="w-full rounded-xl border p-3 mb-3"/><label className="block text-sm font-semibold mb-1">Fecha de grabación</label><input type="date" value={recordDate} onChange={e=>setRecordDate(e.target.value)} className="w-full rounded-xl border p-3 mb-3"/><label className="block text-sm font-semibold mb-1">Fecha de publicación</label><input type="date" value={publishDate} onChange={e=>setPublishDate(e.target.value)} className="w-full rounded-xl border p-3 mb-4"/><button onClick={addContent} className="w-full rounded-xl bg-blue-600 p-3 font-bold text-white">Guardar contenido</button></Modal>}
  </main>;
}
function Metric({title,value,hint}:{title:string;value:string;hint:string}){return <div className="rounded-2xl border bg-white p-4"><p className="text-xs font-semibold text-slate-500">{title}</p><p className="mt-2 text-xl font-black break-words">{value}</p><p className="mt-1 text-[11px] text-slate-400">{hint}</p></div>}
function Action({label,onClick}:{label:string;onClick:()=>void}){return <button onClick={onClick} className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-700">{label}</button>}
function PageTitle({title,subtitle,action,onClick}:{title:string;subtitle?:string;action?:string;onClick?:()=>void}){return <div className="flex items-center justify-between gap-3 mb-4"><div><h1 className="text-2xl font-black">{title}</h1>{subtitle&&<p className="text-sm text-slate-500 mt-1">{subtitle}</p>}</div>{action&&<button onClick={onClick} className="shrink-0 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white">{action}</button>}</div>}
function AgendaRow({title,client,date}:{title:string;client:string;date:string}){return <div className="flex items-center gap-3 border-t py-3"><div className="rounded-xl bg-blue-50 px-3 py-2 text-center text-blue-700"><p className="text-xs font-bold">{date.slice(8,10)}</p><p className="text-[10px]">{date.slice(5,7)}</p></div><div><p className="text-sm font-bold">{title}</p><p className="text-xs text-slate-500">{client} · {date}</p></div></div>}
function Modal({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-3 sm:items-center"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">{title}</h2><button onClick={onClose} className="rounded-lg px-3 py-1 text-xl text-slate-500" aria-label="Cerrar">×</button></div>{children}</div></div>}
