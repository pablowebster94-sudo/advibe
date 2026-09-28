import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";
import type {IdRow,ImageRow} from "@/lib/enfoque-types";
import {removeObjects,storageConfigured,uploadObject} from "@/lib/enfoque-storage";

const allowed=new Set(["image/jpeg","image/png","image/webp","image/avif"]);
const MAX_IMAGES=40;
const unconfigured=()=>NextResponse.json({error:"Storage no está configurado en el servidor."},{status:503});

export async function POST(req:Request){
  const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  if(!storageConfigured())return unconfigured();
  try{
    const form=await req.formData();const file=form.get("file");const propertyId=String(form.get("property_id")||"");const vehicleId=String(form.get("vehicle_id")||"");
    if(!(file instanceof File)||(!propertyId&&!vehicleId)||(propertyId&&vehicleId))return NextResponse.json({error:"Archivo y publicación son obligatorios."},{status:400});
    if(!allowed.has(file.type))return NextResponse.json({error:`${file.name}: formato no permitido. Usa JPG, PNG, WEBP o AVIF.`},{status:400});
    if(file.size>8*1024*1024)return NextResponse.json({error:`${file.name} supera 8 MB.`},{status:400});
    const parent=propertyId?"properties":"vehicles";const id=propertyId||vehicleId;const fk=propertyId?"property_id":"vehicle_id";
    const found=await supabaseAdmin<IdRow[]>(parent+"?id=eq."+encodeURIComponent(id)+"&select=id&limit=1",{},s.token);
    if(!found[0])return NextResponse.json({error:"La publicación no existe."},{status:404});
    const existing=await supabaseAdmin<ImageRow[]>("listing_images?"+fk+"=eq."+encodeURIComponent(id)+"&select=id,sort_order,is_cover&order=sort_order.desc&limit="+MAX_IMAGES,{},s.token);
    if(existing.length>=MAX_IMAGES)return NextResponse.json({error:`Máximo ${MAX_IMAGES} fotos por publicación.`},{status:400});
    const isFirst=!existing.some(x=>x.is_cover);
    const sortOrder=existing.length?Math.max(...existing.map(x=>Number(x.sort_order)||0))+1:0;
    const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-80);
    const path=parent+"/"+id+"/"+crypto.randomUUID()+"-"+safeName;
    const width=Number(form.get("width"))||null,height=Number(form.get("height"))||null;
    await uploadObject(path,await file.arrayBuffer(),file.type);
    try{
      const row=await supabaseAdmin<ImageRow[]>("listing_images",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
        property_id:propertyId||null,vehicle_id:vehicleId||null,storage_path:path,alt_text:String(form.get("alt")||"").slice(0,200)||null,
        width:width&&width>0?Math.round(width):null,height:height&&height>0?Math.round(height):null,sort_order:sortOrder,is_cover:isFirst
      })},s.token);
      return NextResponse.json({ok:true,item:row[0]});
    }catch(error){await removeObjects([path]);throw error;}
  }catch(error){
    console.error("[enfoque] Error subiendo imagen:",error);
    return NextResponse.json({error:"No se pudo subir la imagen."},{status:500});
  }
}

// Reordenar: {ids:[...]} en el orden deseado. Todas deben pertenecer a la misma publicación.
export async function PUT(req:Request){
  const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  try{
    const {ids}=await req.json();
    if(!Array.isArray(ids)||!ids.length||ids.length>MAX_IMAGES||!ids.every(x=>typeof x==="string"))return NextResponse.json({error:"Orden inválido."},{status:400});
    const rows=await supabaseAdmin<ImageRow[]>(`listing_images?id=in.(${ids.map(encodeURIComponent).join(",")})&select=id,property_id,vehicle_id`,{},s.token);
    const parents=new Set(rows.map(r=>r.property_id||r.vehicle_id));
    if(rows.length!==ids.length||parents.size!==1)return NextResponse.json({error:"Las imágenes no pertenecen a la misma publicación."},{status:400});
    await Promise.all(ids.map((id:string,i:number)=>supabaseAdmin(`listing_images?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({sort_order:i})},s.token)));
    return NextResponse.json({ok:true});
  }catch(error){
    console.error("[enfoque] Error reordenando imágenes:",error);
    return NextResponse.json({error:"No se pudo guardar el orden."},{status:500});
  }
}

export async function DELETE(req:Request){
  const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  if(!storageConfigured())return unconfigured();
  try{
    const {id}=await req.json();
    const rows=await supabaseAdmin<ImageRow[]>("listing_images?id=eq."+encodeURIComponent(id)+"&select=id,storage_path,property_id,vehicle_id,is_cover",{},s.token);
    const item=rows[0];if(!item)return NextResponse.json({error:"Imagen no encontrada."},{status:404});
    if(!await removeObjects([item.storage_path]))return NextResponse.json({error:"No se pudo eliminar el archivo."},{status:500});
    await supabaseAdmin("listing_images?id=eq."+encodeURIComponent(id),{method:"DELETE"},s.token);
    // Si era la portada, la siguiente foto pasa a ser portada.
    let newCover:string|null=null;
    if(item.is_cover){
      const fk=item.property_id?"property_id":"vehicle_id";
      const next=await supabaseAdmin<IdRow[]>(`listing_images?${fk}=eq.${encodeURIComponent(String(item.property_id||item.vehicle_id))}&select=id&order=sort_order.asc&limit=1`,{},s.token);
      if(next[0]){newCover=next[0].id;await supabaseAdmin(`listing_images?id=eq.${encodeURIComponent(next[0].id)}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({is_cover:true})},s.token);}
    }
    return NextResponse.json({ok:true,new_cover:newCover});
  }catch(error){
    console.error("[enfoque] Error eliminando imagen:",error);
    return NextResponse.json({error:"No se pudo eliminar la imagen."},{status:500});
  }
}
