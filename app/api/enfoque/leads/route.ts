import {NextResponse} from "next/server";
import {getAttribution} from "@/lib/enfoque-attribution";
import {supabaseAdmin,supabaseAdminConfigured} from "@/lib/enfoque-supabase";
import {capiFields,isE164,normalizePhone,sendMetaEvent} from "@/lib/enfoque-meta";

const INTERESTS=["publicar_propiedad","publicar_vehiculo","comprar_propiedad","alquilar_propiedad","comprar_vehiculo","informacion_general"];
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SITE=process.env.NEXT_PUBLIC_SITE_URL||"https://enfoque.advibeagencia.com";
const uuid=(v:unknown)=>typeof v==="string"&&UUID.test(v)?v:null;
const httpsUrl=(v:unknown)=>typeof v==="string"&&v.startsWith("https://")&&v.length<=2048?v:null;

export async function POST(req:Request){
  try{
    const body=await req.json();
    const name=String(body.name||"").trim().slice(0,120);
    const phone=body.phone?normalizePhone(String(body.phone)):"";
    const email=body.email?String(body.email).trim().toLowerCase().slice(0,254):"";
    if(name.length<2||(!phone&&!email))return NextResponse.json({ok:false,error:"Nombre y teléfono o correo son obligatorios."},{status:400});
    if(phone&&!isE164(phone))return NextResponse.json({ok:false,error:"Revisa el número de WhatsApp (ej. 0991234567)."},{status:400});
    if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return NextResponse.json({ok:false,error:"Revisa el correo electrónico."},{status:400});
    const propertyId=uuid(body.property_id);
    const vehicleId=propertyId?null:uuid(body.vehicle_id);
    const value=Number.isFinite(Number(body.value))&&Number(body.value)>0?Number(body.value):undefined;
    const attr=await getAttribution();
    const eventId=uuid(body.event_id)||crypto.randomUUID();
    const sourceUrl=httpsUrl(body.event_source_url)||attr.landing_url||SITE;
    const lead={
      name,phone:phone||null,email:email||null,
      interest_type:INTERESTS.includes(body.interest_type)?body.interest_type:"informacion_general",property_id:propertyId,vehicle_id:vehicleId,
      message:body.message?String(body.message).slice(0,2000):null,channel:"formulario",ref_code:body.ref_code?String(body.ref_code).slice(0,255):null,
      visitor_id:attr.visitorId||null,utm_source:attr.last_touch?.utm_source||null,utm_medium:attr.last_touch?.utm_medium||null,
      utm_campaign:attr.last_touch?.utm_campaign||null,utm_content:attr.last_touch?.utm_content||null,utm_term:attr.last_touch?.utm_term||null,
      fbclid:attr.last_touch?.fbclid||null,gclid:attr.last_touch?.gclid||null,fbp:body.fbp||null,fbc:body.fbc||null,
      first_touch:attr.first_touch||null,landing_url:httpsUrl(attr.landing_url)||SITE,privacy_accepted_at:new Date().toISOString()
    };
    // En producción un lead que no se puede guardar es un lead perdido: se avisa en vez de fingir éxito.
    if(!supabaseAdminConfigured()&&process.env.NODE_ENV==="production"){
      console.error("[enfoque] Lead rechazado: Supabase (service role) no está configurado.");
      return NextResponse.json({ok:false,error:"No pudimos registrar tu solicitud en este momento. Escríbenos por WhatsApp."},{status:503});
    }
    let leadId=null;
    if(supabaseAdminConfigured()){
      const rows=await supabaseAdmin<any[]>("leads",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify(lead)});
      leadId=rows?.[0]?.id||null;
    }else console.error("[enfoque] Lead recibido pero Supabase (service role) no está configurado: no se guardó.");
    const meta=await sendMetaEvent({
      event_name:"Lead",event_id:eventId,email,phone,fbp:body.fbp,fbc:body.fbc,
      content_id:propertyId||vehicleId||undefined,content_type:propertyId?"home_listing":vehicleId?"vehicle":lead.interest_type,
      value,url:sourceUrl,source:"form",
      client_ip:req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||null,user_agent:req.headers.get("user-agent")
    });
    if(supabaseAdminConfigured()){
      await supabaseAdmin("conversion_events",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({
        event_id:eventId,event_name:"Lead",visitor_id:attr.visitorId||null,lead_id:leadId,
        property_id:propertyId,vehicle_id:vehicleId,cta_source:"form",
        value:value??null,currency:"USD",utm_source:attr.last_touch?.utm_source||null,utm_medium:attr.last_touch?.utm_medium||null,
        utm_campaign:attr.last_touch?.utm_campaign||null,utm_content:attr.last_touch?.utm_content||null,utm_term:attr.last_touch?.utm_term||null,
        fbclid:attr.last_touch?.fbclid||null,gclid:attr.last_touch?.gclid||null,fbp:body.fbp||null,fbc:body.fbc||null,
        event_source_url:sourceUrl,...capiFields(meta)
      })}).catch(error=>console.error("[enfoque] No se registró conversion_event Lead:",error));
    }
    return NextResponse.json({ok:true,lead_id:leadId,event_id:eventId,meta:meta.sent});
  }catch(error){
    console.error("[enfoque] Error registrando lead:",error);
    return NextResponse.json({ok:false,error:"No se pudo registrar el lead."},{status:500});
  }
}
