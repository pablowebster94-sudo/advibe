'use client';

import type { ReactNode } from "react";

import { useEffect, useMemo, useState } from "react";

type Client = { id:string; name:string; monthly:number; day:number|string; status:string; production:number; notes?:string };
type Charge = { id:string; clientId:string; period:string; amount:number; paid:number; due:string };
type Task = { id:string; title:string; clientId?:string; priority:string; status:string; date:string };
type Production = { id:string; clientId:string; title:string; type:string; status:string; due:string };

const initialClients:Client[] = [
  {id:"CLI-0001",name:"Kamauto",monthly:200,day:2,status:"ACTIVO",production:8,notes:"4 Reels + 15 respuestas; editable"},
  {id:"CLI-0002",name:"Muebles Ideal",monthly:200,day:2,status:"ACTIVO",production:8},
  {id:"CLI-0003",name:"Paola Miguitama",monthly:150,day:5,status:"ACTIVO",production:5},
  {id:"CLI-0004",name:"Club Santa Bárbara",monthly:200,day:"9/10",status:"ACTIVO",production:5,notes:"$100 Cuenca día 9 + $100 Gualaceo día 10"},
  {id:"CLI-0005",name:"AM Motorsport",monthly:150,day:14,status:"ACTIVO",production:0},
  {id:"CLI-0006",name:"CETAD San Lucas",monthly:200,day:"—",status:"PENDIENTE_DEFINICION",production:0,notes:"Bloqueado hasta confirmar configuración"},
];

const initialCharges:Charge[] = [
  {id:"COB-0001",clientId:"CLI-0001",period:"2026-09",amount:200,paid:200,due:"2026-09-02"},
  {id:"COB-0002",clientId:"CLI-0002",period:"2026-09",amount:200,paid:100,due:"2026-09-02"},
  {id:"COB-0003",clientId:"CLI-0003",period:"2026-09",amount:150,paid:0,due:"2026-09-05"},
  {id:"COB-0004",clientId:"CLI-0004",period:"2026-09",amount:200,paid:0,due:"2026-09-09"},
  {id:"COB-0005",clientId:"CLI-0005",period:"2026-09",amount:150,paid:0,due:"2026-09-14"},
];

const initialTasks:Task[] = [
  {id:"TSK-0001",title:"Coordinar entrega Manta",clientId:"CLI-0002",priority:"ALTA",status:"PENDIENTE",date:"2026-09-22"},
];

const initialProduction:Production[] = [
  {id:"PRD-0001",clientId:"CLI-0001",title:"Kamauto — Reel #1",type:"REEL",status:"PUBLICADO",due:"2026-09-02"},
  {id:"PRD-0002",clientId:"CLI-0001",title:"Kamauto — Reel #2",type:"REEL",status:"PENDIENTE",due:"2026-09-10"},
];

const money = (n:number) => new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

export default function ControlPage(){
  const [tab,setTab] = useState("hoy");
  const [clients,setClients] = useState<Client[]>(initialClients);
  const [charges,setCharges] = useState<Charge[]>(initialCharges);
  const [tasks,setTasks] = useState<Task[]>(initialTasks);
  const [production,setProduction] = useState<Production[]>(initialProduction);
  const [hydrated,setHydrated] = useState(false);

  useEffect(()=>{
    try {
      const saved = localStorage.getItem("advibe-control-v1");
      if(saved){
        const x=JSON.parse(saved);
        if(x.clients) setClients(x.clients);
        if(x.charges) setCharges(x.charges);
        if(x.tasks) setTasks(x.tasks);
        if(x.production) setProduction(x.production);
      }
    } catch {}
    setHydrated(true);
  },[]);

  useEffect(()=>{
    if(hydrated) localStorage.setItem("advibe-control-v1",JSON.stringify({clients,charges,tasks,production}));
  },[clients,charges,tasks,production,hydrated]);

  const pending = useMemo(()=>charges.reduce((s,c)=>s+Math.max(0,c.amount-c.paid),0),[charges]);
  const collected = useMemo(()=>charges.reduce((s,c)=>s+c.paid,0),[charges]);
  const projected = useMemo(()=>charges.reduce((s,c)=>s+c.amount,0),[charges]);
  const overdue = useMemo(()=>charges.filter(c=>c.paid<c.amount && new Date(c.due)<new Date()).length,[charges]);
  const pendingTasks = tasks.filter(t=>t.status!=="COMPLETADA").length;
  const pendingProd = production.filter(p=>p.status!=="PUBLICADO").length;

  const addClient=()=>{
    const name=prompt("Nombre del cliente:");
    if(!name?.trim()) return;
    const monthly=Number(prompt("Mensualidad USD","0"))||0;
    const day=Number(prompt("Día de pago","1"))||1;
    const id=`CLI-${String(clients.length+1).padStart(4,"0")}`;
    setClients([...clients,{id,name:name.trim(),monthly,day,status:"ACTIVO",production:0}]);
  };

  const addTask=()=>{
    const title=prompt("Título de la tarea:");
    if(!title?.trim()) return;
    const id=`TSK-${String(tasks.length+1).padStart(4,"0")}`;
    setTasks([...tasks,{id,title:title.trim(),priority:"MEDIA",status:"PENDIENTE",date:new Date().toISOString().slice(0,10)}]);
  };

  const addProduction=()=>{
    const clientId=prompt("ID del cliente (ej. CLI-0001):");
    if(!clients.some(c=>c.id===clientId)) return alert("Cliente no encontrado");
    const title=prompt("Título de la pieza:");
    if(!title?.trim()) return;
    const id=`PRD-${String(production.length+1).padStart(4,"0")}`;
    setProduction([...production,{id,clientId,title:title.trim(),type:"REEL",status:"PENDIENTE",due:new Date().toISOString().slice(0,10)}]);
  };

  const pay=(id:string)=>{
    const c=charges.find(x=>x.id===id);
    if(!c) return;
    const balance=c.amount-c.paid;
    const value=Number(prompt(`Saldo pendiente: ${money(balance)}\\nMonto del abono:`,""));
    if(!Number.isFinite(value)||value<=0) return;
    if(value>balance) return alert("El abono no puede superar el saldo.");
    setCharges(charges.map(x=>x.id===id?{...x,paid:x.paid+value}:x));
  };

  const clientName=(id?:string)=>clients.find(c=>c.id===id)?.name||"General";

  return <div className="min-h-screen bg-slate-100 text-slate-900">
    <header className="sticky top-0 z-40 bg-slate-950 text-white border-b border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <div><div className="text-xl font-black">Ad<span className="text-blue-500">Vibe</span> Control</div><div className="text-[10px] uppercase tracking-[.2em] text-slate-400">Centro de mando</div></div>
        <div className="hidden md:block text-xs text-slate-400">Operación · Producción · Cobros</div>
      </div>
    </header>

    <div className="mx-auto max-w-7xl md:flex">
      <aside className="hidden md:block w-56 shrink-0 p-4">
        <nav className="sticky top-24 space-y-1">
          {["hoy","dashboard","clientes","produccion","tareas","cobros","agenda"].map(x=><button key={x} onClick={()=>setTab(x)} className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold ${tab===x?"bg-blue-600 text-white":"hover:bg-white"}`}>{x==="hoy"?"Hoy":x==="dashboard"?"Dashboard":x==="clientes"?"Clientes":x==="produccion"?"Producción":x==="tareas"?"Tareas":x==="cobros"?"Cobros":"Agenda"}</button>)}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-8 pb-28">
        {tab==="hoy" && <section className="space-y-5">
          <div className="rounded-3xl bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white"><div className="text-xs uppercase tracking-widest text-blue-200">AdVibe Control</div><h1 className="mt-1 text-2xl font-black">Centro operativo</h1><p className="mt-1 text-sm text-blue-100">Lo que requiere atención ahora.</p></div>
          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Cobros pendientes" value={money(pending)} sub={`${overdue} vencidos`}/>
            <Card title="Producción pendiente" value={String(pendingProd)} sub="piezas por atender"/>
            <Card title="Tareas" value={String(pendingTasks)} sub="pendientes"/>
          </div>
          <List title="Cobros prioritarios">
            {charges.filter(c=>c.paid<c.amount).map(c=><Row key={c.id} title={clientName(c.clientId)} sub={`${c.period} · saldo ${money(c.amount-c.paid)}`} action={<button onClick={()=>pay(c.id)} className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white">Abonar</button>}/>)}
          </List>
        </section>}

        {tab==="dashboard" && <section className="space-y-5">
          <h1 className="text-2xl font-black">Dashboard</h1>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Proyectado" value={money(projected)} sub="cobros registrados"/>
            <Card title="Cobrado" value={money(collected)} sub="pagos acumulados"/>
            <Card title="Pendiente" value={money(pending)} sub="saldo por cobrar"/>
            <Card title="Vencidos" value={String(overdue)} sub="con saldo pendiente"/>
          </div>
        </section>}

        {tab==="clientes" && <section className="space-y-4">
          <HeaderAction title="Clientes" button="Nuevo cliente" onClick={addClient}/>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{clients.map(c=><div key={c.id} className="rounded-2xl bg-white border p-4 shadow-sm"><div className="flex justify-between"><div><div className="font-black">{c.name}</div><div className="text-xs text-slate-500">{c.id} · día {c.day}</div></div><span className={`text-[10px] font-black px-2 py-1 rounded-lg ${c.status==="ACTIVO"?"bg-emerald-100 text-emerald-700":"bg-amber-100 text-amber-700"}`}>{c.status}</span></div><div className="mt-4 text-lg font-black">{money(c.monthly)}<span className="text-xs font-medium text-slate-400"> / mes</span></div>{c.notes&&<p className="mt-2 text-xs text-slate-500">{c.notes}</p>}</div>)}</div>
        </section>}

        {tab==="produccion" && <section className="space-y-4"><HeaderAction title="Producción" button="Añadir pieza" onClick={addProduction}/><List title="Contenido">{production.map(p=><Row key={p.id} title={p.title} sub={`${clientName(p.clientId)} · ${p.type} · ${p.status}`} action={<button onClick={()=>setProduction(production.map(x=>x.id===p.id?{...x,status:x.status==="PUBLICADO"?"PENDIENTE":"PUBLICADO"}:x))} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">{p.status==="PUBLICADO"?"Reabrir":"Publicar"}</button>}/>)}</List></section>}

        {tab==="tareas" && <section className="space-y-4"><HeaderAction title="Tareas" button="Nueva tarea" onClick={addTask}/><List title="Operación">{tasks.map(t=><Row key={t.id} title={t.title} sub={`${clientName(t.clientId)} · ${t.priority} · ${t.status}`} action={<button onClick={()=>setTasks(tasks.map(x=>x.id===t.id?{...x,status:x.status==="COMPLETADA"?"PENDIENTE":"COMPLETADA"}:x))} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white">{t.status==="COMPLETADA"?"Reabrir":"Completar"}</button>}/>)}</List></section>}

        {tab==="cobros" && <section className="space-y-4"><h1 className="text-2xl font-black">Cobros y abonos</h1><List title="Estado financiero">{charges.map(c=><Row key={c.id} title={clientName(c.clientId)} sub={`${c.period} · ${c.paid>=c.amount?"PAGADO":c.paid>0?"ABONO PARCIAL":"PENDIENTE"}`} action={<div className="text-right"><div className="font-black">{money(c.amount-c.paid)}</div>{c.paid<c.amount&&<button onClick={()=>pay(c.id)} className="mt-1 text-xs font-bold text-blue-600">Registrar abono</button>}</div>}/>)}</List></section>}

        {tab==="agenda" && <section className="space-y-4"><h1 className="text-2xl font-black">Agenda</h1><List title="Próximos eventos">{charges.filter(c=>c.paid<c.amount).map(c=><Row key={c.id} title={clientName(c.clientId)} sub={`Vence ${c.due} · saldo ${money(c.amount-c.paid)}`}/>)}</List></section>}
      </main>
    </div>

    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t p-2 overflow-x-auto"><div className="flex min-w-max justify-around gap-2 mx-auto">{["hoy","dashboard","clientes","produccion","tareas","cobros","agenda"].map(x=><button key={x} onClick={()=>setTab(x)} className={`px-3 py-2 rounded-xl text-[10px] font-black ${tab===x?"bg-blue-600 text-white":"text-slate-500"}`}>{x==="produccion"?"Prod":x==="dashboard"?"Dash":x[0].toUpperCase()+x.slice(1)}</button>)}</div></nav>
  </div>;
}

function Card({title,value,sub}:{title:string,value:string,sub:string}){return <div className="rounded-2xl bg-white border p-5 shadow-sm"><div className="text-[10px] uppercase tracking-widest font-black text-slate-400">{title}</div><div className="mt-2 text-2xl font-black">{value}</div><div className="mt-1 text-xs text-slate-500">{sub}</div></div>}
function List({title,children}:{title:string,children:ReactNode}){return <div className="rounded-2xl bg-white border shadow-sm overflow-hidden"><div className="px-4 py-3 border-b font-black text-sm">{title}</div><div className="divide-y">{children}</div></div>}
function Row({title,sub,action}:{title:string,sub:string,action?:React.ReactNode}){return <div className="p-4 flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-bold text-sm truncate">{title}</div><div className="text-xs text-slate-500 mt-1">{sub}</div></div>{action}</div>}
function HeaderAction({title,button,onClick}:{title:string,button:string,onClick:()=>void}){return <div className="flex items-center justify-between gap-3"><h1 className="text-2xl font-black">{title}</h1><button onClick={onClick} className="rounded-xl bg-blue-600 text-white px-4 py-2.5 text-xs font-black">{button}</button></div>}
