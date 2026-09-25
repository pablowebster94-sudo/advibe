import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
 try{const {id}=await params;const b=await req.json();const patch={brand:b.brand,model:b.model,slug:b.slug,year:Number(b.year),price:Number(b.price),condition:b.condition||"usado",mileage_km:b.mileage_km?Number(b.mileage_km):0,fuel:b.fuel||null,transmission:b.transmission||null,engine:b.engine||null,description:b.description||"",publication_status:b.publication_status||"borrador",availability:b.availability||"disponible",is_featured:Boolean(b.is_featured),features:Array.isArray(b.features)?b.features:[]};const rows=await supabaseAdmin<any[]>(`vehicles?id=eq.${encodeURIComponent(id)}&select=*`,{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify(patch)},s.token);if(!rows[0])return NextResponse.json({error:"Vehículo no encontrado."},{status:404});return NextResponse.json({ok:true,item:rows[0]})}catch{return NextResponse.json({error:"No se pudo actualizar el vehículo."},{status:500})}
}
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});try{const {id}=await params;await supabaseAdmin(`vehicles?id=eq.${encodeURIComponent(id)}`,{method:"DELETE"},s.token);return NextResponse.json({ok:true})}catch{return NextResponse.json({error:"No se pudo eliminar."},{status:500})}}
