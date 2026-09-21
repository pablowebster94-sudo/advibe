import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";

function storageBase(){return (process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||"").replace(/\/$/,"")}

export async function POST(req:Request){
 const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
 try{
  const form=await req.formData();const file=form.get("file");const propertyId=String(form.get("property_id")||"");const vehicleId=String(form.get("vehicle_id")||"");
  if(!(file instanceof File)||(!propertyId&&!vehicleId)|| (propertyId&&vehicleId))return NextResponse.json({error:"Archivo y publicación son obligatorios."},{status:400});
  if(!file.type.startsWith("image/"))return NextResponse.json({error:"Solo se permiten imágenes."},{status:400});
  if(file.size>8*1024*1024)return NextResponse.json({error:"La imagen supera 8 MB."},{status:400});
  const bucket="listing-media";const parent=propertyId?"properties": "vehicles";const id=propertyId||vehicleId;const path=`${parent}/${id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"_")}`;
  const bytes=await file.arrayBuffer();const base=storageBase();const upload=await fetch(`${base}/storage/v1/object/${bucket}/${path}`,{method:"POST",headers:{"Authorization":`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,"apikey":process.env.SUPABASE_SERVICE_ROLE_KEY||"","Content-Type":file.type,"x-upsert":"false"},body:bytes});
  if(!upload.ok)throw new Error(await upload.text());
  const row=await supabaseAdmin<any[]>( "listing_images",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({property_id:propertyId||null,vehicle_id:vehicleId||null,storage_path:path,alt_text:file.name,sort_order:0,is_cover:false})},s.token);
  return NextResponse.json({ok:true,item:row[0]});
 }catch(e){return NextResponse.json({error:"No se pudo subir la imagen."},{status:500})}
}
export async function DELETE(req:Request){
 const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
 try{
  const {id}=await req.json();const rows=await supabaseAdmin<any[]>(`listing_images?id=eq.${encodeURIComponent(id)}&select=id,storage_path`,{},s.token);const item=rows[0];if(!item)return NextResponse.json({error:"Imagen no encontrada."},{status:404});
  const base=storageBase();await fetch(`${base}/storage/v1/object/listing-media/${item.storage_path}`,{method:"DELETE",headers:{"Authorization":`Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,"apikey":process.env.SUPABASE_SERVICE_ROLE_KEY||"","Content-Type":"application/json"}});
  await supabaseAdmin(`listing_images?id=eq.${encodeURIComponent(id)}`,{method:"DELETE"},s.token);return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"No se pudo eliminar la imagen."},{status:500})}
}
