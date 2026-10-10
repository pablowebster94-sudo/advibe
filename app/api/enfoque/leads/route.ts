import type {IdRow} from "@/lib/enfoque-types";
import {NextResponse,after} from "next/server";
import {getAttribution} from "@/lib/enfoque-attribution";
import {supabaseAdmin,supabaseAdminConfigured} from "@/lib/enfoque-supabase";
import {capiFields,clientIp,isValidPhone,normalizePhone,resolveFbc,resolveFbp,sendMetaEvent} from "@/lib/enfoque-meta";
import {asUuid,resolveListing} from "@/lib/enfoque-listing-lookup";
import {notifyNewLead} from "@/lib/enfoque-notify";

const INTERESTS=["publicar_propiedad","publicar_vehiculo","comprar_propiedad","alquilar_propiedad","comprar_vehiculo","informacion_general"];
const SITE=process.env.NEXT_PUBLIC_SITE_URL||"https://enfoque.advibeagencia.com";
const httpsUrl=(v:unknown)=>typeof v==="string"&&v.startsWith("https://")&&v.length<=2048?v:null;
const fail=(error:string,status:number)=>NextResponse.json({ok:false,error},{status});

export async function POST(req:Request){
  let body:Record<string,unknown>;
  try{body=await req.json();}catch{return fail("Solicitud inválida.",400);}
  // Honeypot: campo oculto que solo rellenan los bots. Se responde "ok" sin guardar nada.
  if(body.website)return NextResponse.json({ok:true});
  const name=String(body.name||"").trim().replace(/\s+/g," ").slice(0,120);
  const phone=body.phone?normalizePhone(String(body.phone)):"";
  const email=body.email?String(body.email).trim().toLowerCase().slice(0,254):"";
  if(name.length<2)return fail("Escribe tu nombre.",400);
  if(!phone&&!email)return fail("Déjanos un WhatsApp o un correo para contactarte.",400);
  if(phone&&!isValidPhone(phone))return fail("Revisa el número de WhatsApp (ej. 0991234567).",400);
  if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return fail("Revisa el correo electrónico.",400);
  // En producción un lead que no se puede guardar es un lead perdido: se avisa en vez de fingir éxito.
  if(!supabaseAdminConfigured()){
    console.error("[enfoque] Lead rechazado: Supabase (service role) no está configurado.");
    return fail("No pudimos registrar tu solicitud en este momento. Escríbenos por WhatsApp.",503);
  }
  try{
    const attr=await getAttribution();
    const touch=attr.last_touch||{};
    const listing=await resolveListing(body.property_id,body.vehicle_id);
    const eventId=asUuid(body.event_id)||crypto.randomUUID();
    const sourceUrl=httpsUrl(body.event_source_url)||httpsUrl(attr.landing_url)||SITE;
    const fbp=resolveFbp(body.fbp),fbc=resolveFbc(body.fbc,touch);
    const interest=INTERESTS.includes(String(body.interest_type))?String(body.interest_type):"informacion_general";
    const lead={
      name,phone:phone||null,email:email||null,interest_type:interest,property_id:listing.property_id,vehicle_id:listing.vehicle_id,
      message:body.message?String(body.message).trim().slice(0,2000)||null:null,channel:"formulario",
      visitor_id:asUuid(attr.visitorId),utm_source:touch.utm_source||null,utm_medium:touch.utm_medium||null,
      utm_campaign:touch.utm_campaign||null,utm_content:touch.utm_content||null,utm_term:touch.utm_term||null,
      fbclid:touch.fbclid||null,gclid:touch.gclid||null,fbp,fbc,
      first_touch:attr.first_touch||null,landing_url:httpsUrl(attr.landing_url)||SITE,privacy_accepted_at:new Date().toISOString()
    };
    const rows=await supabaseAdmin<IdRow[]>("leads",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify(lead)});
    const leadId=rows?.[0]?.id||null;
    const ip=clientIp(req),ua=req.headers.get("user-agent");
    // Aviso, CAPI y registro del evento después de responder: si algo falla o tarda, el lead ya está guardado.
    after(async()=>{
      const listingRef=listing.property_id?{type:"property" as const,id:listing.property_id}:listing.vehicle_id?{type:"vehicle" as const,id:listing.vehicle_id}:null;
      const notice=notifyNewLead({id:leadId,name,phone:lead.phone,email:lead.email,interest_type:interest,channel:"formulario",message:lead.message,
        listing:listingRef&&{...listingRef,title:listing.label,price:listing.price},utm_source:lead.utm_source,utm_campaign:lead.utm_campaign});
      const meta=await sendMetaEvent({
        event_name:"Lead",event_id:eventId,email,phone,fbp,fbc,external_id:lead.visitor_id,
        content_id:listing.property_id||listing.vehicle_id||undefined,content_type:listing.property_id?"home_listing":listing.vehicle_id?"vehicle":interest,
        value:listing.price,url:sourceUrl,source:"form",client_ip:ip,user_agent:ua
      });
      await supabaseAdmin("conversion_events",{method:"POST",headers:{"Prefer":"return=minimal"},body:JSON.stringify({
        event_id:eventId,event_name:"Lead",visitor_id:lead.visitor_id,lead_id:leadId,
        property_id:listing.property_id,vehicle_id:listing.vehicle_id,cta_source:"form",
        value:listing.price??null,currency:"USD",city:listing.city||null,utm_source:lead.utm_source,utm_medium:lead.utm_medium,
        utm_campaign:lead.utm_campaign,utm_content:lead.utm_content,utm_term:lead.utm_term,
        fbclid:lead.fbclid,gclid:lead.gclid,fbp,fbc,event_source_url:sourceUrl,...capiFields(meta)
      })}).catch(error=>console.error("[enfoque] No se registró conversion_event Lead:",error));
      await notice;
    });
    return NextResponse.json({ok:true,lead_id:leadId,event_id:eventId});
  }catch(error){
    console.error("[enfoque] Error registrando lead:",error);
    return fail("No pudimos registrar tu solicitud. Intenta de nuevo o escríbenos por WhatsApp.",500);
  }
}
