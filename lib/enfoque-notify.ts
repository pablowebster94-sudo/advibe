// Aviso inmediato de lead nuevo: POST JSON a ENFOQUE_LEAD_WEBHOOK_URL (Make, Zapier, n8n,
// un bot de Telegram/WhatsApp…). No hay proveedor de email en el repo: el email se arma
// en el escenario de Make/Zapier/n8n a partir de este mismo JSON.
// Reglas: nunca lanza, nunca bloquea la respuesta (se llama dentro de after()) y si la
// variable no existe no hace nada. El payload no lleva tokens ni claves.

export type LeadNotice={
  id:string|null;name:string;phone:string|null;email:string|null;interest_type:string;channel:string;
  message?:string|null;listing?:{type:"property"|"vehicle";id:string;title?:string;price?:number}|null;
  search_criteria?:Record<string,unknown>|null;utm_source?:string|null;utm_campaign?:string|null;ref_code?:string|null;
};

const INTEREST_LABEL:Record<string,string>={
  busco_propiedad:"Busca propiedad",publicar_propiedad:"Quiere publicar una propiedad",publicar_vehiculo:"Quiere publicar un vehículo",
  comprar_propiedad:"Quiere comprar una propiedad",alquilar_propiedad:"Busca alquiler",comprar_vehiculo:"Quiere comprar un vehículo",informacion_general:"Información general"
};

const site=(env:Record<string,string|undefined>)=>(env.NEXT_PUBLIC_SITE_URL||"https://enfoque.advibeagencia.com").replace(/\/$/,"");

/** Resumen de criterios en una línea (para el texto del aviso). */
export function criteriaSummary(c:Record<string,unknown>|null|undefined){
  if(!c)return "";
  const parts=[c.what,c.operation,c.canton,typeof c.budget_max==="number"?`hasta USD ${c.budget_max.toLocaleString("en-US")}`:null,
    c.from_abroad?`desde ${c.country||"el exterior"}`:null,c.timeframe?`plazo: ${c.timeframe}`:null];
  return parts.filter(Boolean).map(String).join(" · ");
}

/** JSON que recibe el webhook. Incluye `text` listo para reenviar tal cual (Telegram, WhatsApp, Slack…). */
export function leadWebhookPayload(lead:LeadNotice,env:Record<string,string|undefined>=process.env,now=new Date()){
  const interest=INTEREST_LABEL[lead.interest_type]||lead.interest_type;
  const origin=lead.utm_campaign||lead.utm_source||"Directo/orgánico";
  const criteria=criteriaSummary(lead.search_criteria);
  const text=[`Nuevo lead en Enfoque Visual: ${lead.name}`,interest+(lead.listing?.title?` — ${lead.listing.title}`:""),criteria,
    lead.phone?`WhatsApp: ${lead.phone}`:"",lead.email?`Correo: ${lead.email}`:"",`Origen: ${origin}`,`Panel: ${site(env)}/admin/leads`].filter(Boolean).join("\n");
  return {
    event:"lead.created",source:"enfoque-visual",created_at:now.toISOString(),
    lead:{id:lead.id,name:lead.name,phone:lead.phone,email:lead.email,interest_type:lead.interest_type,interest_label:interest,channel:lead.channel,
      message:lead.message||null,ref_code:lead.ref_code||null,listing:lead.listing||null,search_criteria:lead.search_criteria||null,
      whatsapp_url:lead.phone?"https://wa.me/"+lead.phone.replace(/\D/g,""):null},
    attribution:{utm_source:lead.utm_source||null,utm_campaign:lead.utm_campaign||null},
    admin_url:`${site(env)}/admin/leads`,
    text
  };
}

/** URL del webhook si es válida (https). */
export function leadWebhookUrl(env:Record<string,string|undefined>=process.env){
  const url=(env.ENFOQUE_LEAD_WEBHOOK_URL||"").trim();
  if(!url)return null;
  try{return new URL(url).protocol==="https:"?url:null;}catch{return null;}
}

/** Envía el aviso. Devuelve el resultado; nunca lanza. */
export async function notifyNewLead(lead:LeadNotice,env:Record<string,string|undefined>=process.env,fetchImpl:typeof fetch=fetch)
  :Promise<{sent:boolean;reason?:string;status?:number}>{
  const url=leadWebhookUrl(env);
  if(!url)return {sent:false,reason:env.ENFOQUE_LEAD_WEBHOOK_URL?"invalid_url":"not_configured"};
  try{
    const r=await fetchImpl(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(leadWebhookPayload(lead,env)),
      cache:"no-store",signal:AbortSignal.timeout(5000)});
    // La URL puede llevar un token (p. ej. el de un bot): nunca se registra entera.
    if(!r.ok)console.error("[enfoque] El webhook de leads respondió",r.status,"en",new URL(url).host);
    return {sent:r.ok,status:r.status};
  }catch(error){
    console.error("[enfoque] El webhook de leads no respondió:",(error as Error)?.name||"error");
    return {sent:false,reason:"network_error"};
  }
}
