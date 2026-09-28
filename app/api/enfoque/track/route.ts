import {NextResponse,after} from "next/server";
import {getAttribution} from "@/lib/enfoque-attribution";
import {supabaseAdmin,supabaseAdminConfigured} from "@/lib/enfoque-supabase";
import {capiFields,clientIp,resolveFbc,resolveFbp,sendMetaEvent} from "@/lib/enfoque-meta";
import {asUuid,resolveListing} from "@/lib/enfoque-listing-lookup";

const text=(v:unknown,max=255)=>typeof v==="string"&&v?v.slice(0,max):null;
const SITE=process.env.NEXT_PUBLIC_SITE_URL||"https://enfoque.advibeagencia.com";

// Eventos de navegador que se replican por CAPI con el mismo event_id (deduplicación):
//  · ViewContent: al abrir una ficha (solo CAPI, no se guarda).
//  · Contact: clic en WhatsApp → CAPI + conversion_events con el código de referencia.
// Los Lead van por /api/enfoque/leads.
export async function POST(req:Request){
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return NextResponse.json({ok:false,error:"Solicitud inválida."},{status:400});}
  if(body.event_name!=="Contact"&&body.event_name!=="ViewContent")return NextResponse.json({ok:false,error:"Evento no permitido"},{status:400});
  try{
    const attr=await getAttribution();
    const touch=attr.last_touch||{};
    const eventId=asUuid(body.event_id)||crypto.randomUUID();
    const listing=supabaseAdminConfigured()?await resolveListing(body.property_id,body.vehicle_id):{property_id:null,vehicle_id:null};
    const sourceUrl=typeof body.event_source_url==="string"&&body.event_source_url.startsWith("https://")?body.event_source_url.slice(0,2048):SITE;
    const fbp=resolveFbp(body.fbp),fbc=resolveFbc(body.fbc,touch);
    const refCode=typeof body.ref_code==="string"&&/^EV-[A-Z0-9]{5,8}$/.test(body.ref_code)?body.ref_code:null;
    const ip=clientIp(req),ua=req.headers.get("user-agent");
    const name=body.event_name as "Contact"|"ViewContent";
    let saved=false;
    if(name==="Contact"&&supabaseAdminConfigured()){
      await supabaseAdmin("conversion_events",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({
        event_id:eventId,event_name:"Contact",visitor_id:asUuid(attr.visitorId),ref_code:refCode,property_id:listing.property_id,vehicle_id:listing.vehicle_id,
        cta_source:text(body.cta_source,40),value:listing.price??null,currency:"USD",city:listing.city||text(body.city,120),
        utm_source:touch.utm_source||null,utm_medium:touch.utm_medium||null,utm_campaign:touch.utm_campaign||null,
        utm_content:touch.utm_content||null,utm_term:touch.utm_term||null,fbclid:touch.fbclid||null,gclid:touch.gclid||null,
        fbp,fbc,event_source_url:sourceUrl,capi_status:"pendiente"
      })});
      saved=true;
    }
    after(async()=>{
      const result=await sendMetaEvent({event_name:name,event_id:eventId,fbp,fbc,external_id:asUuid(attr.visitorId),value:listing.price,currency:"USD",
        content_id:listing.property_id||listing.vehicle_id||undefined,content_type:text(body.content_type,40)||undefined,source:text(body.cta_source,40)||undefined,
        url:sourceUrl,client_ip:ip,user_agent:ua});
      if(saved)await supabaseAdmin(`conversion_events?event_id=eq.${eventId}`,{method:"PATCH",headers:{"Prefer":"return=minimal"},body:JSON.stringify(capiFields(result))})
        .catch(error=>console.error("[enfoque] No se actualizó capi_status:",error));
    });
    return NextResponse.json({ok:true,event_id:eventId});
  }catch(error){
    console.error("[enfoque] Error registrando evento:",error);
    return NextResponse.json({ok:false,error:"No se pudo registrar el evento."},{status:500});
  }
}
