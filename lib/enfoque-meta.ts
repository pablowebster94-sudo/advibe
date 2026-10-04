async function sha256(value:string){
  const data=new TextEncoder().encode(value);
  const digest=await crypto.subtle.digest("SHA-256",data);
  return Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
}
export function isE164(value:string){return /^\+[1-9][0-9]{7,14}$/.test(value);}
/** E.164 válido y, si es de Ecuador, con la longitud real: móvil +593 9XXXXXXXX o fijo +593 [2-7]XXXXXXX. */
export function isValidPhone(e164:string){
  if(!isE164(e164))return false;
  if(e164.startsWith("+593"))return /^\+593(9\d{8}|[2-7]\d{7})$/.test(e164);
  return true;
}
function norm(value:string){return value.trim().toLowerCase();}
/** Normaliza a E.164 asumiendo Ecuador (+593) para números locales. */
export function normalizePhone(value:string){
  const digits=value.replace(/\D/g,"");
  if(!digits)return "";
  if(digits.startsWith("00"))return "+"+digits.slice(2);
  if(digits.startsWith("593"))return "+"+digits;
  if(digits.startsWith("0"))return "+593"+digits.slice(1);
  if(digits.length===9&&digits.startsWith("9"))return "+593"+digits; // móvil EC sin el 0 inicial
  return "+"+digits;
}
export async function sendMetaEvent(input:{
  event_name:"ViewContent"|"Contact"|"Lead";event_id:string;email?:string|null;phone?:string|null;
  fbp?:string|null;fbc?:string|null;value?:number;currency?:string;
  content_id?:string;content_type?:string;source?:string;url?:string;test_event_code?:string;client_ip?:string|null;user_agent?:string|null;external_id?:string|null
}){
  const token=process.env.META_ENFOQUE_ACCESS_TOKEN;
  const pixel=process.env.META_ENFOQUE_PIXEL_ID;
  if(!token||!pixel)return {sent:false,reason:"not_configured"};
  const user_data:Record<string,unknown>={};
  if(input.email&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim()))user_data.em=[await sha256(norm(input.email))];
  if(input.phone){
    const normalizedPhone=normalizePhone(input.phone);
    // Meta exige solo dígitos con código de país (sin "+") antes del hash.
    if(normalizedPhone)user_data.ph=[await sha256(normalizedPhone.replace(/\D/g,""))];
  }
  if(input.fbp)user_data.fbp=input.fbp;
  if(input.fbc)user_data.fbc=input.fbc;
  if(input.client_ip)user_data.client_ip_address=input.client_ip;
  if(input.user_agent)user_data.client_user_agent=input.user_agent;
  if(input.external_id)user_data.external_id=[await sha256(input.external_id)];
  const event={
    event_name:input.event_name,event_time:Math.floor(Date.now()/1000),event_id:input.event_id,
    action_source:"website",event_source_url:input.url||"https://enfoque.advibeagencia.com",
    user_data,
    custom_data:{content_ids:input.content_id?[input.content_id]:undefined,content_type:input.content_type,
      ...(typeof input.value==="number"?{value:input.value,currency:input.currency||"USD"}:{}),source:input.source}
  };
  const version=process.env.META_ENFOQUE_GRAPH_API_VERSION||"v26.0";
  // META_ENFOQUE_TEST_EVENT_CODE solo para validar en "Probar eventos" del Administrador de eventos.
  const testCode=input.test_event_code||process.env.META_ENFOQUE_TEST_EVENT_CODE;
  try{
    const r=await fetch(`https://graph.facebook.com/${version}/${pixel}/events`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({data:[event],access_token:token,...(testCode?{test_event_code:testCode}:{})}),cache:"no-store",
      signal:AbortSignal.timeout(8000)
    });
    const body=await r.text();
    if(!r.ok)console.error("[enfoque] Meta CAPI respondió",r.status,body.slice(0,500));
    return {sent:r.ok,status:r.status,body:body.slice(0,500)};
  }catch(error){
    console.error("[enfoque] Meta CAPI no respondió:",error);
    return {sent:false,reason:"network_error"};
  }
}

/** Columnas capi_* de conversion_events a partir del resultado de sendMetaEvent. */
export function capiFields(result:{sent:boolean;reason?:string;status?:number;body?:string}){
  if(result.sent)return {capi_status:"enviado",capi_attempts:1,capi_sent_at:new Date().toISOString()};
  if(result.reason==="not_configured")return {capi_status:"omitido"};
  return {capi_status:"fallido",capi_attempts:1,capi_last_error:(result.reason||`HTTP ${result.status}: ${result.body||""}`).slice(0,500)};
}

/**
 * _fbc para CAPI: la cookie del Pixel si existe; si no (Pixel bloqueado, iOS, etc.),
 * se construye desde el fbclid capturado por el middleware: fb.1.<ms del clic>.<fbclid>.
 */
export function resolveFbc(cookieFbc:unknown,touch?:{fbclid?:string;ts?:number}|null){
  if(typeof cookieFbc==="string"&&/^fb\.\d\.\d+\./.test(cookieFbc))return cookieFbc.slice(0,255);
  if(touch?.fbclid)return `fb.1.${Number(touch.ts)||Date.now()}.${touch.fbclid}`.slice(0,255);
  return null;
}
export function resolveFbp(cookieFbp:unknown){
  return typeof cookieFbp==="string"&&/^fb\.\d\.\d+\.\d+$/.test(cookieFbp)?cookieFbp:null;
}
export function clientIp(req:Request){
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||req.headers.get("x-real-ip")||null;
}
