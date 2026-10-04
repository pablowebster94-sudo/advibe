import Link from "next/link";
import {redirect} from "next/navigation";
import {adminTry,getAdminSession} from "@/lib/enfoque-admin";
import type {VehicleRow} from "@/lib/enfoque-types";
import {AdminNav} from "@/components/enfoque/admin/AdminNav";
import {ListingTable} from "@/components/enfoque/admin/ListingTable";

export const dynamic="force-dynamic";
export default async function Vehicles({searchParams}:{searchParams:Promise<{estado?:string}>}){
  const s=await getAdminSession();if(!s)redirect("/enfoque-visual/admin/login");
  const estado=(await searchParams).estado||"";
  const filter=["publicado","borrador","archivado"].includes(estado)?estado:"";
  const {data:rows,error}=await adminTry<VehicleRow[]>(`vehicles?select=id,brand,model,year,slug,price,mileage_km,publication_status,availability,is_featured,cover_path&order=created_at.desc${filter?`&publication_status=eq.${filter}`:""}`,s.token,[]);
  return <><AdminNav active="/enfoque-visual/admin/vehiculos" name={s.profile.full_name||undefined}/><main className="min-h-screen bg-[#f5f3ee] px-5 py-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="ev-display text-5xl font-black">Vehículos</h1><p className="mt-2 text-black/50">{rows.length} en esta vista</p></div><Link href="/enfoque-visual/admin/vehiculos/nuevo" className="rounded-full bg-black px-5 py-3 font-bold text-white">+ Nuevo vehículo</Link></div>
    {error&&<p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">No se pudo leer Supabase: {error.slice(0,200)}</p>}
    <ListingTable filter={filter} filterBase="/enfoque-visual/admin/vehiculos" editBase="/enfoque-visual/admin/vehiculos/" publicBase="/enfoque-visual/vehiculos/" endpoint="/api/enfoque/admin/vehiculos"
      rows={rows.map(v=>({id:v.id,title:`${v.brand} ${v.model} ${v.year}`,subtitle:`${Number(v.mileage_km||0).toLocaleString("es-EC")} km · ${v.slug}`,slug:v.slug,price:Number(v.price),status:v.publication_status,availability:v.availability,featured:v.is_featured,cover:v.cover_path}))}/>
  </div></main></>;
}
