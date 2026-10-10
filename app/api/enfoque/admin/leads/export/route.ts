import type {LeadRow} from "@/lib/enfoque-types";
import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";
import {leadsToCsv} from "@/lib/enfoque-leads-csv";
import {leadFilterQuery} from "@/lib/enfoque-leads-filter";

// Exporta los leads a CSV con la sesión del panel (RLS: solo staff). Respeta los filtros de la vista.
export async function GET(req:Request){
  const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  const sp=new URL(req.url).searchParams;
  try{
    const rows=await supabaseAdmin<LeadRow[]>(`leads?select=id,name,phone,email,status,channel,interest_type,message,notes,ref_code,utm_source,utm_medium,utm_campaign,utm_content,fbclid,gclid,search_criteria,consent_at,created_at,properties(title,slug),vehicles(brand,model,year,slug)&order=created_at.desc&limit=5000${leadFilterQuery(sp.get("estado"),sp.get("tipo"))}`,{},s.token);
    const date=new Date().toLocaleDateString("en-CA",{timeZone:"America/Guayaquil"});
    return new Response(leadsToCsv(rows),{headers:{"Content-Type":"text/csv; charset=utf-8",
      "Content-Disposition":`attachment; filename="enfoque-leads-${sp.get("tipo")==="buscadores"?"buscadores-":""}${date}.csv"`,"Cache-Control":"no-store"}});
  }catch(error){
    console.error("[enfoque] Error exportando leads:",error);
    return NextResponse.json({error:"No se pudo exportar."},{status:500});
  }
}
