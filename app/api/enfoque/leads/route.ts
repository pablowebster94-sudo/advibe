import {NextResponse} from "next/server";
import {getAttribution} from "@/lib/enfoque-attribution";
import {supabaseAdmin,supabaseAdminConfigured} from "@/lib/enfoque-supabase";

export async function POST(req:Request) {
  try {
    const body=await req.json();
    if (!body.name || (!body.phone && !body.email)) return NextResponse.json({ok:false,error:"Nombre y teléfono o correo son obligatorios."},{status:400});
    const attr=await getAttribution();
    const lead={
      name:String(body.name).slice(0,120),phone:body.phone || null,email:body.email || null,
      interest_type:body.interest_type || "informacion_general",property_id:body.property_id || null,vehicle_id:body.vehicle_id || null,
      message:body.message ? String(body.message).slice(0,2000) : null,channel:body.channel || "formulario",
      ref_code:body.ref_code || null,visitor_id:attr.visitorId || null,
      utm_source:attr.last_touch?.utm_source || null,utm_medium:attr.last_touch?.utm_medium || null,
      utm_campaign:attr.last_touch?.utm_campaign || null,utm_content:attr.last_touch?.utm_content || null,utm_term:attr.last_touch?.utm_term || null,
      fbclid:attr.last_touch?.fbclid || null,gclid:attr.last_touch?.gclid || null,fbp:body.fbp || null,fbc:body.fbc || null,
      first_touch:attr.first_touch || null,landing_url:attr.landing_url || null,privacy_accepted_at:new Date().toISOString()
    };
    if (supabaseAdminConfigured()) {
      const rows=await supabaseAdmin<any[]>("leads",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify(lead)});
      return NextResponse.json({ok:true,lead_id:rows?.[0]?.id || null});
    }
    return NextResponse.json({ok:true,lead_id:null,mode:"preview"});
  } catch {
    return NextResponse.json({ok:false,error:"No se pudo registrar el lead."},{status:500});
  }
}
