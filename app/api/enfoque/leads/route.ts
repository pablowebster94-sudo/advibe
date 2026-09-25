import {NextResponse} from "next/server";
import {getAttribution} from "@/lib/enfoque-attribution";
import {supabaseAdmin,supabaseAdminConfigured} from "@/lib/enfoque-supabase";
import {sendMetaEvent} from "@/lib/enfoque-meta";

export async function POST(req:Request){
  try{
    const body=await req.json();
    if(!body.name||(!body.phone&&!body.email))return NextResponse.json({ok:false,error:"Nombre y teléfono o correo son obligatorios."},{status:400});
    const attr=await getAttribution();
    const eventId=body.event_id||crypto.randomUUID();
    const lead={
      name:String(body.name).slice(0,120),phone:body.phone||null,email:body.email||null,
      interest_type:body.interest_type||"informacion_general",property_id:body.property_id||null,vehicle_id:body.vehicle_id||null,
      message:body.message?String(body.message).slice(0,2000):null,channel:body.channel||"formulario",ref_code:body.ref_code||null,
      visitor_id:attr.visitorId||null,utm_source:attr.last_touch?.utm_source||null,utm_medium:attr.last_touch?.utm_medium||null,
      utm_campaign:attr.last_touch?.utm_campaign||null,utm_content:attr.last_touch?.utm_content||null,utm_term:attr.last_touch?.utm_term||null,
      fbclid:attr.last_touch?.fbclid||null,gclid:attr.last_touch?.gclid||null,fbp:body.fbp||null,fbc:body.fbc||null,
      first_touch:attr.first_touch||null,landing_url:attr.landing_url||"https://enfoque.advibeagencia.com",privacy_accepted_at:new Date().toISOString()
    };
    let leadId=null;
    if(supabaseAdminConfigured()){
      const rows=await supabaseAdmin<any[]>("leads",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify(lead)});
      leadId=rows?.[0]?.id||null;
    }
    const meta=await sendMetaEvent({
      event_name:"Lead",event_id:eventId,email:body.email,phone:body.phone,fbp:body.fbp,fbc:body.fbc,
      content_id:body.property_id||body.vehicle_id,content_type:body.property_id?"home_listing":body.vehicle_id?"vehicle":body.interest_type,
      value:body.value,url:attr.landing_url||"https://enfoque.advibeagencia.com"
    });
    if(supabaseAdminConfigured()){
      await supabaseAdmin("conversion_events",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({
        event_id:eventId,event_name:"Lead",visitor_id:attr.visitorId||null,lead_id:leadId,
        property_id:body.property_id||null,vehicle_id:body.vehicle_id||null,cta_source:"form",
        value:body.value||null,currency:"USD",utm_source:attr.last_touch?.utm_source||null,utm_medium:attr.last_touch?.utm_medium||null,
        utm_campaign:attr.last_touch?.utm_campaign||null,utm_content:attr.last_touch?.utm_content||null,utm_term:attr.last_touch?.utm_term||null,
        fbclid:attr.last_touch?.fbclid||null,gclid:attr.last_touch?.gclid||null,fbp:body.fbp||null,fbc:body.fbc||null,
        event_source_url:attr.landing_url||"https://enfoque.advibeagencia.com",capi_status:meta.sent?"enviado":meta.reason==="not_configured"?"omitido":"fallido"
      })}).catch(()=>{});
    }
    return NextResponse.json({ok:true,lead_id:leadId,event_id:eventId,meta:meta.sent});
  }catch{return NextResponse.json({ok:false,error:"No se pudo registrar el lead."},{status:500})}
}
