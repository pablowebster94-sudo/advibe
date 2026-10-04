import Link from "next/link";
import {redirect} from "next/navigation";
import {adminTry,getAdminSession} from "@/lib/enfoque-admin";
import type {PropertyRow} from "@/lib/enfoque-types";
import {AdminNav} from "@/components/enfoque/admin/AdminNav";
import {ListingTable} from "@/components/enfoque/admin/ListingTable";

export const dynamic="force-dynamic";
export default async function Properties({searchParams}:{searchParams:Promise<{estado?:string}>}){
  const s=await getAdminSession();if(!s)redirect("/enfoque-visual/admin/login");
  const estado=(await searchParams).estado||"";
  const filter=["publicado","borrador","archivado"].includes(estado)?estado:"";
  const {data:rows,error}=await adminTry<PropertyRow[]>(`properties?select=id,title,slug,price,city,sector,operation_type,property_type,publication_status,availability,is_featured,cover_path&order=created_at.desc${filter?`&publication_status=eq.${filter}`:""}`,s.token,[]);
  return <><AdminNav active="/enfoque-visual/admin/propiedades" name={s.profile.full_name||undefined}/><main className="min-h-screen bg-[#f5f3ee] px-5 py-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="ev-display text-5xl font-black">Propiedades</h1><p className="mt-2 text-black/50">{rows.length} en esta vista</p></div><Link href="/enfoque-visual/admin/propiedades/nueva" className="rounded-full bg-black px-5 py-3 font-bold text-white">+ Nueva propiedad</Link></div>
    {error&&<p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">No se pudo leer Supabase: {error.slice(0,200)}</p>}
    <ListingTable filter={filter} filterBase="/enfoque-visual/admin/propiedades" editBase="/enfoque-visual/admin/propiedades/" publicBase="/enfoque-visual/propiedades/" endpoint="/api/enfoque/admin/properties"
      rows={rows.map(p=>({id:p.id,title:p.title,subtitle:[p.operation_type,p.property_type,p.city,p.sector].filter(Boolean).join(" · "),slug:p.slug,price:Number(p.price),status:p.publication_status,availability:p.availability,featured:p.is_featured,cover:p.cover_path}))}/>
  </div></main></>;
}
