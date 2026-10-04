import type {EventRow,IdRow,LeadRow} from "@/lib/enfoque-types";
import {NextResponse} from "next/server";
import {getAdminSession} from "@/lib/enfoque-admin";
import {supabaseAdmin} from "@/lib/enfoque-supabase";
import {isValidPhone,normalizePhone} from "@/lib/enfoque-meta";

// Registra como lead a quien escribió por WhatsApp, usando el código de referencia
// del mensaje (EV-XXXXXX) para recuperar la publicación y la campaña del clic.
export async function POST(req:Request){
  const s=await getAdminSession();if(!s)return NextResponse.json({error:"No autorizado"},{status:401});
  try{
    const b=await req.json();
    const ref=String(b.ref_code||"").trim().toUpperCase();
    const name=String(b.name||"").trim().slice(0,120);
    const phone=normalizePhone(String(b.phone||""));
    if(name.length<2)return NextResponse.json({error:"Escribe el nombre."},{status:400});
    if(!isValidPhone(phone))return NextResponse.json({error:"Teléfono no válido (ej. 0991234567)."},{status:400});
    if(ref&&!/^EV-[A-Z0-9]{5,8}$/.test(ref))return NextResponse.json({error:"Código de referencia no válido (formato EV-XXXXXX)."},{status:400});
    const event=ref?(await supabaseAdmin<EventRow[]>(`conversion_events?ref_code=eq.${ref}&event_name=eq.Contact&select=*&limit=1`,{},s.token))[0]:null;
    if(ref&&!event)return NextResponse.json({error:`No hay ningún clic de WhatsApp con la referencia ${ref}.`},{status:404});
    const existing=ref?(await supabaseAdmin<IdRow[]>(`leads?ref_code=eq.${ref}&select=id&limit=1`,{},s.token))[0]:null;
    if(existing)return NextResponse.json({error:"Esa referencia ya está registrada como lead."},{status:409});
    const interest=event?.property_id?"comprar_propiedad":event?.vehicle_id?"comprar_vehiculo":"informacion_general";
    const rows=await supabaseAdmin<LeadRow[]>("leads",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({
      name,phone,channel:"whatsapp",ref_code:ref||null,interest_type:interest,message:b.message?String(b.message).slice(0,2000):null,
      property_id:event?.property_id||null,vehicle_id:event?.vehicle_id||null,visitor_id:event?.visitor_id||null,
      utm_source:event?.utm_source||null,utm_medium:event?.utm_medium||null,utm_campaign:event?.utm_campaign||null,utm_content:event?.utm_content||null,utm_term:event?.utm_term||null,
      fbclid:event?.fbclid||null,gclid:event?.gclid||null,fbp:event?.fbp||null,fbc:event?.fbc||null,landing_url:event?.event_source_url||null
    })},s.token);
    if(event)await supabaseAdmin(`conversion_events?id=eq.${event.id}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify({lead_id:rows[0].id})},s.token).catch(()=>{});
    return NextResponse.json({ok:true,item:rows[0]});
  }catch(error){
    console.error("[enfoque] Error registrando lead de WhatsApp:",error);
    return NextResponse.json({error:"No se pudo registrar el lead."},{status:500});
  }
}
