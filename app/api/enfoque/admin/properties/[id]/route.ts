import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const s=await getAdminSession(); if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  try{
    const {id}=await params; const b=await req.json();
    const patch={title:b.title,slug:b.slug,price:Number(b.price),city:b.city,province:b.province||"Azuay",sector:b.sector||null,
      description:b.description||"",property_type:b.property_type||"casa",operation_type:b.operation_type||"venta",
      publication_status:b.publication_status||"borrador",availability:b.availability||"disponible",is_featured:Boolean(b.is_featured),
      land_area_m2:b.land_area_m2?Number(b.land_area_m2):null,built_area_m2:b.built_area_m2?Number(b.built_area_m2):null,
      bedrooms:b.bedrooms?Number(b.bedrooms):null,bathrooms:b.bathrooms?Number(b.bathrooms):null,
      parking_spots:b.parking_spots?Number(b.parking_spots):null,features:Array.isArray(b.features)?b.features:[]};
    const rows=await supabaseAdmin<any[]>(`properties?id=eq.${encodeURIComponent(id)}&select=*`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify(patch)},s.token);
    if(!rows[0])return NextResponse.json({error:"Propiedad no encontrada."},{status:404});
    return NextResponse.json({ok:true,item:rows[0]});
  }catch(e){return NextResponse.json({error:"No se pudo actualizar la propiedad."},{status:500})}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){
  const s=await getAdminSession(); if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  try{const {id}=await params;await supabaseAdmin(`properties?id=eq.${encodeURIComponent(id)}`,{method:"DELETE"},s.token);return NextResponse.json({ok:true})}
  catch{return NextResponse.json({error:"No se pudo eliminar."},{status:500})}
}
