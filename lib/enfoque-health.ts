import {demoAllowed} from "@/lib/enfoque-catalog";
import {supabaseHeaders,supabasePublic} from "@/lib/enfoque-supabase";
import type {IdRow} from "@/lib/enfoque-types";
import {leadWebhookUrl} from "@/lib/enfoque-notify";

// Chequeo de configuración de producción. Nunca devuelve secretos, solo si existen.
export type HealthCheck={id:string;label:string;status:"ok"|"warn"|"error";detail:string};

export async function runHealthChecks(env:Record<string,string|undefined>=process.env,options:{remote?:boolean}={}):Promise<HealthCheck[]>{
  const checks:HealthCheck[]=[];
  const add=(id:string,label:string,status:HealthCheck["status"],detail:string)=>checks.push({id,label,status,detail});
  const wa=(env.NEXT_PUBLIC_WHATSAPP_NUMBER||"").replace(/\D/g,"");
  // NEXT_PUBLIC_* se incrustan al compilar: si cambian, hay que volver a desplegar.
  add("whatsapp","WhatsApp",!wa?"error":/^593\d{9}$/.test(wa)?"ok":"warn",
    !wa?"NEXT_PUBLIC_WHATSAPP_NUMBER no está configurada: el botón de WhatsApp no aparece en las fichas.":/^593\d{9}$/.test(wa)?`Número configurado (termina en ${wa.slice(-4)}).`:"El número no parece +593 9XXXXXXXX. Revísalo (solo dígitos, con código de país).");
  const pubUrl=env.NEXT_PUBLIC_SUPABASE_URL,anon=env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!pubUrl||!anon)add("supabase_public","Supabase (catálogo público)","error","Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY: el catálogo sale vacío.");
  else{
    try{
      const [p,v]=await Promise.all([supabasePublic<IdRow[]>("properties?select=id&publication_status=eq.publicado"),supabasePublic<IdRow[]>("vehicles?select=id&publication_status=eq.publicado")]);
      add("supabase_public","Supabase (catálogo público)","ok",`Conecta. Publicadas: ${p.length} propiedades, ${v.length} vehículos.`);
    }catch(e){add("supabase_public","Supabase (catálogo público)","error","No responde: "+String((e as Error).message).slice(0,160));}
  }
  if(!(env.SUPABASE_URL||pubUrl)||!env.SUPABASE_SERVICE_ROLE_KEY)
    add("supabase_service","Supabase service role (leads, fotos)","error","Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY: los formularios muestran error y no se pueden subir fotos.");
  else{
    const base=(env.SUPABASE_URL||pubUrl||"").replace(/\/$/,"");
    try{
      const r=await fetch(`${base}/storage/v1/bucket/listing-media`,{headers:supabaseHeaders("service",undefined,env),cache:"no-store",signal:AbortSignal.timeout(6000)});
      const bucket=r.ok?await r.json():null;
      if(!r.ok)add("supabase_service","Supabase service role + Storage","error",`El bucket listing-media no responde (${r.status}). Aplica supabase/schema.sql.`);
      else add("supabase_service","Supabase service role + Storage",bucket.public?"ok":"error",bucket.public?"Service role válida y bucket listing-media público.":"El bucket listing-media no es público: las fotos no se verán.");
    }catch(e){add("supabase_service","Supabase service role + Storage","error","No responde: "+String((e as Error).message).slice(0,160));}
  }
  const demo=demoAllowed(env);
  add("demo","Datos demo",demo&&env.NODE_ENV==="production"?"error":"ok",
    demo?(env.NODE_ENV==="production"?"ENFOQUE_ALLOW_DEMO=true en producción: pueden aparecer propiedades de ejemplo. Quítala.":"Activos (entorno de desarrollo)."):"Desactivados: nunca aparecen publicaciones de ejemplo.");
  const pixel=env.META_ENFOQUE_PIXEL_ID,browserPixel=env.NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID,token=env.META_ENFOQUE_ACCESS_TOKEN;
  add("pixel","Meta Pixel (navegador)",browserPixel?"ok":"error",browserPixel?`Pixel ${browserPixel}.`:"NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID no está configurada: no hay eventos de navegador.");
  if(!pixel||!token)add("capi","Meta CAPI (servidor)","error","Faltan META_ENFOQUE_PIXEL_ID / META_ENFOQUE_ACCESS_TOKEN: los eventos se marcan como “omitido” (los leads se guardan igual).");
  else if(options.remote===false)add("capi","Meta CAPI (servidor)","ok",`Pixel ${pixel} con token configurado (no verificado).`);
  else{
    // Verifica token y dataset contra la Graph API sin enviar eventos.
    try{
      const version=env.META_ENFOQUE_GRAPH_API_VERSION||"v26.0";
      const r=await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(pixel)}?fields=id,name&access_token=${encodeURIComponent(token)}`,{cache:"no-store",signal:AbortSignal.timeout(6000)});
      const text=await r.text();
      let d:{name?:string;error?:{message?:string}}={};
      try{d=JSON.parse(text);}catch{}
      add("capi","Meta CAPI (servidor)",r.ok?"ok":"error",r.ok?`Token válido para el dataset “${d.name||pixel}”.`
        :d.error?`Meta rechaza el token o el pixel: ${String(d.error.message).slice(0,160)}`:`No se pudo verificar con Meta (HTTP ${r.status}): ${text.slice(0,120)}`);
    }catch(e){add("capi","Meta CAPI (servidor)","warn","No se pudo contactar con Meta para verificar el token: "+String((e as Error).message).slice(0,120));}
  }
  if(pixel&&browserPixel&&pixel!==browserPixel)add("dedup","Deduplicación Pixel/CAPI","error",`El pixel del navegador (${browserPixel}) y el de CAPI (${pixel}) son distintos: Meta no puede deduplicar.`);
  if(env.META_ENFOQUE_TEST_EVENT_CODE)add("test_code","Código de prueba de CAPI","warn","META_ENFOQUE_TEST_EVENT_CODE está activo: TODOS los eventos van a “Probar eventos”. Quítalo al terminar la verificación.");
  // La URL del webhook puede llevar un token (bot de Telegram, Make…): solo se muestra el host.
  const hook=leadWebhookUrl(env);
  add("lead_webhook","Aviso de lead nuevo (webhook)",hook?"ok":"warn",hook?`Cada lead nuevo se envía a ${new URL(hook).host}.`
    :env.ENFOQUE_LEAD_WEBHOOK_URL?"ENFOQUE_LEAD_WEBHOOK_URL no es una URL https válida: no se avisa de los leads nuevos."
    :"ENFOQUE_LEAD_WEBHOOK_URL no está configurada: los leads solo aparecen en el panel, nadie recibe aviso inmediato.");
  add("site","URL del sitio",env.NEXT_PUBLIC_SITE_URL?"ok":"warn",env.NEXT_PUBLIC_SITE_URL?env.NEXT_PUBLIC_SITE_URL:"NEXT_PUBLIC_SITE_URL no está definida; se usa https://enfoque.advibeagencia.com.");
  add("ga","Google Analytics",env.NEXT_PUBLIC_ENFOQUE_GA_ID||env.NEXT_PUBLIC_GA_ID?"ok":"warn",env.NEXT_PUBLIC_ENFOQUE_GA_ID||env.NEXT_PUBLIC_GA_ID?"Configurado.":"Sin ID de GA (opcional).");
  return checks;
}
