import type {IdRow} from "@/lib/enfoque-types";
import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";

const STATUSES=["nuevo","contactado","calificado","visita_agendada","negociacion","cerrado","descartado"];

export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  const {id}=await params;
  const b=await req.json().catch(()=>({}));
  const patch:Record<string,unknown>={};
  if(b.status!==undefined){if(!STATUSES.includes(b.status))return NextResponse.json({error:"Estado inválido"},{status:400});patch.status=b.status;}
  if(typeof b.notes==="string")patch.notes=b.notes.slice(0,4000)||null;
  if(!Object.keys(patch).length)return NextResponse.json({error:"Nada que actualizar"},{status:400});
  try{
    const rows=await supabaseAdmin<IdRow[]>("leads?id=eq."+encodeURIComponent(id),{method:"PATCH",headers:{"Prefer":"return=representation"},body:JSON.stringify(patch)},s.token);
    if(!rows[0])return NextResponse.json({error:"Lead no encontrado"},{status:404});
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:"No se pudo actualizar"},{status:500})}
}
