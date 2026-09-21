import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";

function storageBase(){return (process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||"").replace(/\/$/,"")}
const allowed=new Set(["image/jpeg","image/png","image/webp","image/avif"]);

export async function POST(req:Request){
 const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
 if(!process.env.SUPABASE_SERVICE_ROLE_KEY)return NextResponse.json({error:"Storage no está configurado en el servidor."},{status:503});
 try{
  const form=await req.formData();const file=form.get("file");const propertyId=String(form.get("property_id")||"");const vehicleId=String(form.get("vehicle_id")||"");
  if(!(file instanceof File)||(!propertyId&&!vehicleId)||(propertyId&&vehicleId))return NextResponse.json({error:"Archivo y publicación son obligatorios."},{status:400});
  if(!allowed.has(file.type))return NextResponse.json({error:"Formato no permitido. Usa JPG, PNG, WEBP o AVIF."},{status:400});
  if(file.size>8*1024*1024)return NextResponse.json({error:"La imagen supera 8 MB."},{status:400});
  const table=propertyId?"properties":"vehicles";const id=propertyId||vehicleId;
  const found=await supabaseAdmin<any[]>(table+"?id=eq."+encodeURIComponent(id)+"&select=id&limit=1",{},s.token);
  if(!found[0])return NextResponse.json({error:"La publicación no existe."},{status:404});
  const imageTable=propertyId?"property_id":"vehicle_id";
  const existing=await supabaseAdmin<any[]>("listing_images?"+imageTable+"=eq."+encodeURIComponent(id)+"&select=id,sort_order,is_cover&order=sort_order.desc&limit=50",{},s.token);
  const isFirst=existing.length===0;
  const sortOrder=isFirst?0:Math.max(...existing.map(x=>Number(x.sort_order)||0))+1;
  const parent=propertyId?"properties":"vehicles";
  const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const path=parent+"/"+id+"/"+crypto.randomUUID()+"-"+safeName;
  const bytes=await file.arrayBuffer();const base=storageBase();
  const upload=await fetch(base+"/storage/v1/object/listing-media/"+path,{method:"POST",headers:{
    "Authorization":"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,"apikey":process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Content-Type":file.type,"x-upsert":"false"
  },body:bytes});
  if(!upload.ok)throw new Error(await upload.text());
  try{
    const row=await supabaseAdmin<any[]>("listing_images",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      property_id:propertyId||null,vehicle_id:vehicleId||null,storage_path:path,alt_text:file.name,width:null,height:null,sort_order:sortOrder,is_cover:isFirst
    })},s.token);
    return NextResponse.json({ok:true,item:row[0]});
  }catch(error){
    await fetch(base+"/storage/v1/object/listing-media/"+path,{method:"DELETE",headers:{
      "Authorization":"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,"apikey":process.env.SUPABASE_SERVICE_ROLE_KEY
    }}).catch(()=>{});
    throw error;
  }
 }
 catch{return NextResponse.json({error:"No se pudo subir la imagen."},{status:500})}
}
export async function DELETE(req:Request){
 const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
 if(!process.env.SUPABASE_SERVICE_ROLE_KEY)return NextResponse.json({error:"Storage no está configurado en el servidor."},{status:503});
 try{
  const {id}=await req.json();const rows=await supabaseAdmin<any[]>("listing_images?id=eq."+encodeURIComponent(id)+"&select=id,storage_path,property_id,vehicle_id",{},s.token);
  const item=rows[0];if(!item)return NextResponse.json({error:"Imagen no encontrada."},{status:404});
  const base=storageBase();const storageResponse=await fetch(base+"/storage/v1/object/listing-media/"+item.storage_path,{method:"DELETE",headers:{
    "Authorization":"Bearer "+process.env.SUPABASE_SERVICE_ROLE_KEY,"apikey":process.env.SUPABASE_SERVICE_ROLE_KEY
  }});
  if(!storageResponse.ok && storageResponse.status!==404)return NextResponse.json({error:"No se pudo eliminar el archivo."},{status:500});
  await supabaseAdmin("listing_images?id=eq."+encodeURIComponent(id),{method:"DELETE"},s.token);
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"No se pudo eliminar la imagen."},{status:500})}
}
