import type {ImageRow,VehicleRow} from "@/lib/enfoque-types";
import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";
import {removeObjects,storageConfigured} from "@/lib/enfoque-storage";
import {dbError,vehiclePayload,quickPatch} from "@/lib/enfoque-listing";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const s=await getAdminSession(); if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  try{
    const {id}=await params;
    const body=await req.json();
    // quick: cambios parciales desde el listado; si no, edición completa del formulario.
    const p=body.quick?quickPatch(body):vehiclePayload(body);
    if(!p.ok)return NextResponse.json({error:p.error},{status:400});
    const rows=await supabaseAdmin<VehicleRow[]>(`vehicles?id=eq.${encodeURIComponent(id)}&select=*`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify(p.data)},s.token);
    if(!rows[0])return NextResponse.json({error:"Vehículo no encontrado."},{status:404});
    return NextResponse.json({ok:true,item:rows[0]});
  }catch(e){
    console.error("[enfoque] Error actualizando vehículo:",e);
    return NextResponse.json({error:dbError(e,"No se pudo actualizar el vehículo.")},{status:500});
  }
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const s=await getAdminSession(); if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  try{
    const {id}=await params;
    // Las filas de listing_images caen en cascada; los archivos de Storage hay que borrarlos aparte.
    const images=await supabaseAdmin<ImageRow[]>(`listing_images?vehicle_id=eq.${encodeURIComponent(id)}&select=storage_path`,{},s.token);
    await supabaseAdmin(`vehicles?id=eq.${encodeURIComponent(id)}`,{method:"DELETE"},s.token);
    if(storageConfigured())await removeObjects(images.map(x=>x.storage_path));
    return NextResponse.json({ok:true});
  }
  catch{return NextResponse.json({error:"No se pudo eliminar."},{status:500})}
}
