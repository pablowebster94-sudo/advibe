import Link from "next/link";
import {label} from "@/lib/enfoque-filters";
import {QuickActions} from "./QuickActions";
import {ListingImage} from "../ListingImage";

export type Row={id:string;title:string;subtitle:string;slug:string;price:number;status:string;availability:string;featured:boolean;cover?:string|null};
const statusColor:Record<string,string>={publicado:"bg-[#d9ff3f]",borrador:"bg-amber-100",archivado:"bg-black/10"};
const coverUrl=(p?:string|null)=>p?`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${p}`:null;

export function ListingTable({rows,editBase,publicBase,endpoint,filter,filterBase}:{rows:Row[];editBase:string;publicBase:string;endpoint:string;filter:string;filterBase:string}){
  const tabs:[string,string][]=[["","Todas"],["publicado","Publicadas"],["borrador","Borradores"],["archivado","Archivadas"]];
  return <>
    <div className="mt-6 flex flex-wrap gap-2">{tabs.map(([v,l])=><Link key={v} href={v?`${filterBase}?estado=${v}`:filterBase} className={"rounded-full px-4 py-2 text-sm font-bold "+(filter===v?"bg-black text-white":"bg-white ring-1 ring-black/10")}>{l}</Link>)}</div>
    <div className="mt-4 overflow-hidden rounded-3xl bg-white">
      {rows.map(r=><div key={r.id} className="grid gap-3 border-b border-black/5 px-4 py-4 md:grid-cols-[72px_1fr_120px_auto_90px] md:items-center md:px-6">
        <div className="relative hidden h-14 w-[72px] overflow-hidden rounded-xl bg-black/5 md:block">{coverUrl(r.cover)&&<ListingImage src={coverUrl(r.cover)!} alt="" sizes="72px"/>}</div>
        <div className="min-w-0"><p className="truncate font-black">{r.title}</p><p className="truncate text-sm text-black/45">{r.subtitle}</p>
          <p className="mt-1 flex flex-wrap gap-1 text-[11px] font-black uppercase"><span className={"rounded-full px-2 py-0.5 "+(statusColor[r.status]||"bg-black/5")}>{label(r.status)}</span>{r.availability!=="disponible"&&<span className="rounded-full bg-black px-2 py-0.5 text-white">{label(r.availability)}</span>}</p></div>
        <span className="font-bold">${Number(r.price).toLocaleString("es-EC")}</span>
        <QuickActions id={r.id} endpoint={endpoint} status={r.status} featured={r.featured}/>
        <div className="flex gap-2 md:flex-col"><Link href={editBase+r.id} className="rounded-full bg-black px-4 py-2 text-center text-sm font-bold text-white">Editar</Link>
          {r.status==="publicado"&&<Link href={publicBase+r.slug} target="_blank" className="rounded-full bg-black/5 px-4 py-2 text-center text-xs font-bold">Ver ↗</Link>}</div>
      </div>)}
      {!rows.length&&<p className="p-8 text-center text-sm text-black/50">No hay publicaciones en esta vista.</p>}
    </div>
  </>;
}
