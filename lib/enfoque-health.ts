import {demoAllowed} from "@/lib/enfoque-catalog";
import {supabasePublic} from "@/lib/enfoque-supabase";

// Chequeo de configuración de producción. Nunca devuelve secretos, solo si existen.
export type HealthCheck={id:string;label:string;status:"ok"|"warn"|"error";detail:string};

export async function runHealthChecks(env:Record<string,string|undefined>=process.env):Promise<HealthCheck[]>{
  const checks:HealthCheck[]=[];
  const add=(id:string,label:string,status:HealthCheck["status"],detail:string)=>checks.push({id,label,status,detail});
  const wa=(env.NEXT_PUBLIC_WHATSAPP_NUMBER||"").replace(/\D/g,"");
  add("whatsapp","WhatsApp",!wa?"error":/^593\d{9}$/.test(wa)?"ok":"warn",
    !wa?"NEXT_PUBLIC_WHATSAPP_NUMBER no está configurada: el botón de WhatsApp no aparece en las fichas.":/^593\d{9}$/.test(wa)?`Número configurado (termina en ${wa.slice(-4)}).`:"El número no parece +593 9XXXXXXXX. Revísalo (solo dígitos, con código de país).");
  const pubUrl=env.NEXT_PUBLIC_SUPABASE_URL,anon=env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!pubUrl||!anon)add("supabase_public","Supabase (catálogo público)","error","Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY: el catálogo sale vacío.");
  else{
    try{
      const [p,v]=await Promise.all([supabasePublic<any[]>("properties?select=id&publication_status=eq.publicado"),supabasePublic<any[]>("vehicles?select=id&publication_status=eq.publicado")]);
      add("supabase_public","Supabase (catálogo público)","ok",`Conecta. Publicadas: ${p.length} propiedades, ${v.length} vehículos.`);
    }catch(e){add("supabase_public","Supabase (catálogo público)","error","No responde: "+String((e as Error).message).slice(0,160));}
  }
  add("supabase_service","Supabase service role (leads, fotos)",env.SUPABASE_URL&&env.SUPABASE_SERVICE_ROLE_KEY?"ok":"error",
    env.SUPABASE_URL&&env.SUPABASE_SERVICE_ROLE_KEY?"Configurado.":"Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY: los leads no se guardan y no se pueden subir fotos.");
  const demo=demoAllowed(env);
  add("demo","Datos demo",demo&&env.NODE_ENV==="production"?"error":"ok",
    demo?(env.NODE_ENV==="production"?"ENFOQUE_ALLOW_DEMO=true en producción: pueden aparecer propiedades de ejemplo. Quítala.":"Activos (entorno de desarrollo)."):"Desactivados: nunca aparecen publicaciones de ejemplo.");
  const pixel=env.META_ENFOQUE_PIXEL_ID,browserPixel=env.NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID,token=env.META_ENFOQUE_ACCESS_TOKEN;
  add("pixel","Meta Pixel (navegador)",browserPixel?"ok":"error",browserPixel?`Pixel ${browserPixel}.`:"NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID no está configurada: no hay eventos de navegador.");
  add("capi","Meta CAPI (servidor)",pixel&&token?"ok":"error",pixel&&token?`Pixel ${pixel} con token configurado.`:"Faltan META_ENFOQUE_PIXEL_ID / META_ENFOQUE_ACCESS_TOKEN: los eventos se marcan como “omitido”.");
  if(pixel&&browserPixel&&pixel!==browserPixel)add("dedup","Deduplicación Pixel/CAPI","error",`El pixel del navegador (${browserPixel}) y el de CAPI (${pixel}) son distintos: Meta no puede deduplicar.`);
  if(env.META_ENFOQUE_TEST_EVENT_CODE)add("test_code","Código de prueba de CAPI","warn","META_ENFOQUE_TEST_EVENT_CODE está activo: TODOS los eventos van a “Probar eventos”. Quítalo al terminar la verificación.");
  add("site","URL del sitio",env.NEXT_PUBLIC_SITE_URL?"ok":"warn",env.NEXT_PUBLIC_SITE_URL?env.NEXT_PUBLIC_SITE_URL:"NEXT_PUBLIC_SITE_URL no está definida; se usa https://enfoque.advibeagencia.com.");
  add("ga","Google Analytics",env.NEXT_PUBLIC_ENFOQUE_GA_ID||env.NEXT_PUBLIC_GA_ID?"ok":"warn",env.NEXT_PUBLIC_ENFOQUE_GA_ID||env.NEXT_PUBLIC_GA_ID?"Configurado.":"Sin ID de GA (opcional).");
  return checks;
}
