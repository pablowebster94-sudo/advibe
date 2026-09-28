import type {VehicleRow} from "@/lib/enfoque-types";
import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";
import {dbError,vehiclePayload} from "@/lib/enfoque-listing";
import {defaultOwner} from "@/lib/enfoque-owner";

export async function POST(req:Request){
  const s=await getAdminSession(); if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  try{
    const p=vehiclePayload(await req.json());
    if(!p.ok)return NextResponse.json({error:p.error},{status:400});
    const rows=await supabaseAdmin<VehicleRow[]>("vehicles",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({...p.data,currency:"USD",owner_id:await defaultOwner(s.token)})},s.token);
    return NextResponse.json({ok:true,item:rows[0]});
  }catch(e){
    console.error("[enfoque] Error creando vehículo:",e);
    return NextResponse.json({error:dbError(e,"No se pudo crear el vehículo.")},{status:500});
  }
}
