import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";

// Marca una imagen como portada (y desmarca la anterior) y/o cambia su texto alternativo.
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  try{
    const {id}=await params;const b=await req.json();
    const rows=await supabaseAdmin<any[]>(`listing_images?id=eq.${encodeURIComponent(id)}&select=*`,{},s.token);
    const item=rows[0];if(!item)return NextResponse.json({error:"Imagen no encontrada."},{status:404});
    const patch:Record<string,unknown>={};
    if(b.is_cover===true){
      const field=item.property_id?"property_id":"vehicle_id";const parent=item.property_id||item.vehicle_id;
      await supabaseAdmin(`listing_images?${field}=eq.${encodeURIComponent(parent)}&is_cover=eq.true&id=neq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({is_cover:false})},s.token);
      patch.is_cover=true;
    }
    if(typeof b.alt_text==="string")patch.alt_text=b.alt_text.trim().slice(0,200)||null;
    if(Number.isInteger(b.sort_order)&&b.sort_order>=0)patch.sort_order=b.sort_order;
    if(Object.keys(patch).length)await supabaseAdmin(`listing_images?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify(patch)},s.token);
    return NextResponse.json({ok:true});
  }catch(error){
    console.error("[enfoque] Error actualizando imagen:",error);
    return NextResponse.json({error:"No se pudo actualizar la imagen."},{status:500});
  }
}
