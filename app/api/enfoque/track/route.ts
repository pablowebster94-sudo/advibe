import {NextResponse} from "next/server";
import {getAttribution} from "@/lib/enfoque-attribution";
import {supabaseAdmin,supabaseAdminConfigured} from "@/lib/enfoque-supabase";

export async function POST(req:Request) {
  try {
    const body=await req.json();
    if (!["Contact","Lead"].includes(body.event_name)) return NextResponse.json({ok:false,error:"Evento no permitido"},{status:400});
    const attr=await getAttribution();
    const eventId=body.event_id || crypto.randomUUID();
    if (supabaseAdminConfigured()) {
      await supabaseAdmin("conversion_events",{
        method:"POST",
        headers:{"Prefer":"return=minimal"},
        body:JSON.stringify({
          event_id:eventId,event_name:body.event_name,visitor_id:attr.visitorId,ref_code:body.ref_code,
          property_id:body.property_id,vehicle_id:body.vehicle_id,cta_source:body.cta_source,
          value:body.value,currency:body.currency || "USD",city:body.city,
          utm_source:attr.last_touch?.utm_source,utm_medium:attr.last_touch?.utm_medium,
          utm_campaign:attr.last_touch?.utm_campaign,utm_content:attr.last_touch?.utm_content,
          utm_term:attr.last_touch?.utm_term,fbclid:attr.last_touch?.fbclid,gclid:attr.last_touch?.gclid,
          event_source_url:body.event_source_url || process.env.NEXT_PUBLIC_SITE_URL || "https://enfoque.advibeagencia.com"
        })
      });
    }
    return NextResponse.json({ok:true,event_id:eventId});
  } catch {
    return NextResponse.json({ok:false,error:"No se pudo registrar el evento."},{status:500});
  }
}
