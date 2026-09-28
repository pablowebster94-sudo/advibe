import {NextResponse} from "next/server";
import {getAttribution} from "@/lib/enfoque-attribution";
import {supabaseAdmin,supabaseAdminConfigured} from "@/lib/enfoque-supabase";
import {capiFields,sendMetaEvent} from "@/lib/enfoque-meta";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const uuid=(v:unknown)=>typeof v==="string"&&UUID.test(v)?v:null;
const text=(v:unknown,max=255)=>typeof v==="string"&&v?v.slice(0,max):null;
const SITE=process.env.NEXT_PUBLIC_SITE_URL||"https://enfoque.advibeagencia.com";

// Clic en WhatsApp → evento Contact (CAPI + conversion_events). Los Lead van por /api/enfoque/leads.
export async function POST(req:Request){
  try{
    const body=await req.json();
    if(body.event_name!=="Contact")return NextResponse.json({ok:false,error:"Evento no permitido"},{status:400});
    const attr=await getAttribution();
    const eventId=uuid(body.event_id)||crypto.randomUUID();
    const propertyId=uuid(body.property_id);
    const vehicleId=propertyId?null:uuid(body.vehicle_id);
    const value=Number.isFinite(Number(body.value))&&Number(body.value)>0?Number(body.value):undefined;
    const sourceUrl=typeof body.event_source_url==="string"&&body.event_source_url.startsWith("https://")?body.event_source_url.slice(0,2048):SITE;
    const result=await sendMetaEvent({event_name:"Contact",event_id:eventId,fbp:text(body.fbp),fbc:text(body.fbc),value,currency:"USD",
      content_id:propertyId||vehicleId||undefined,content_type:text(body.content_type,40)||undefined,source:text(body.cta_source,40)||undefined,url:sourceUrl,
      client_ip:req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||null,user_agent:req.headers.get("user-agent")});
    if(supabaseAdminConfigured())await supabaseAdmin("conversion_events",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({
      event_id:eventId,event_name:"Contact",visitor_id:attr.visitorId||null,ref_code:text(body.ref_code),property_id:propertyId,vehicle_id:vehicleId,
      cta_source:text(body.cta_source),value:value??null,currency:"USD",city:text(body.city,120),
      utm_source:attr.last_touch?.utm_source||null,utm_medium:attr.last_touch?.utm_medium||null,utm_campaign:attr.last_touch?.utm_campaign||null,
      utm_content:attr.last_touch?.utm_content||null,utm_term:attr.last_touch?.utm_term||null,fbclid:attr.last_touch?.fbclid||null,gclid:attr.last_touch?.gclid||null,
      fbp:text(body.fbp),fbc:text(body.fbc),event_source_url:sourceUrl,...capiFields(result)
    })});
    return NextResponse.json({ok:true,event_id:eventId});
  }catch(error){
    console.error("[enfoque] Error registrando Contact:",error);
    return NextResponse.json({ok:false,error:"No se pudo registrar el evento."},{status:500});
  }
}
