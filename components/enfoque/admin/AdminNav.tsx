import Link from "next/link";

const links:[string,string][]=[["/enfoque-visual/admin","Panel"],["/enfoque-visual/admin/propiedades","Propiedades"],["/enfoque-visual/admin/vehiculos","Vehículos"],["/enfoque-visual/admin/leads","Leads"],["/enfoque-visual/admin/estado","Estado"]];

export function AdminNav({active,name}:{active:string;name?:string}){
  return <header className="border-b border-black/10 bg-white">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-3">
      <Link href="/enfoque-visual/admin" className="ev-display text-lg font-black">ENFOQUE<span className="text-black/35">PANEL</span></Link>
      <nav className="-mx-1 flex max-w-full gap-1 overflow-x-auto text-sm font-bold" aria-label="Panel">
        {links.map(([href,label])=><Link key={href} href={href} className={"whitespace-nowrap rounded-full px-3 py-2 "+(active===href?"bg-black text-white":"hover:bg-black/5")}>{label}</Link>)}
      </nav>
      <div className="flex items-center gap-2 text-sm">
        {name&&<span className="hidden text-black/50 md:inline">{name}</span>}
        <Link href="/enfoque-visual" target="_blank" className="rounded-full px-3 py-2 font-bold hover:bg-black/5">Ver sitio ↗</Link>
        <form action="/api/enfoque/auth/logout" method="post"><button className="rounded-full bg-black/5 px-3 py-2 font-bold">Salir</button></form>
      </div>
    </div>
  </header>;
}
