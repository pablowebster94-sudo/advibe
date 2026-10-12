// Límite de peticiones simple por IP (ventana fija, en memoria).
//
// LIMITACIÓN EN SERVERLESS (Vercel): cada instancia de la función tiene su propia memoria,
// que se pierde en cada arranque en frío y no se comparte entre instancias ni regiones.
// Es un freno de "mejor esfuerzo" contra ráfagas de un mismo cliente (bots, dobles envíos),
// no una garantía. Para un límite global: Vercel Firewall (rate limiting rules) o un
// almacén compartido (Upstash Redis / Vercel KV) con la misma interfaz.

export type RateLimitRule={limit:number;windowMs:number};
export type RateLimitResult={ok:boolean;remaining:number;retryAfter:number};

export const RATE_LIMITS={
  leads:{limit:5,windowMs:10*60_000},   // 5 formularios cada 10 min por IP
  track:{limit:60,windowMs:60_000}      // 60 eventos (Contact/ViewContent) por minuto por IP
} satisfies Record<string,RateLimitRule>;

const MAX_KEYS=10_000;

export function createRateLimiter(rule:RateLimitRule){
  const hits=new Map<string,{count:number;reset:number}>();
  return function check(key:string,now=Date.now()):RateLimitResult{
    let entry=hits.get(key);
    if(!entry||entry.reset<=now){
      // Limpieza perezosa para que la memoria no crezca sin límite.
      if(hits.size>=MAX_KEYS)for(const [k,v] of hits)if(v.reset<=now||hits.size>=MAX_KEYS)hits.delete(k);
      entry={count:0,reset:now+rule.windowMs};
      hits.set(key,entry);
    }
    entry.count++;
    const ok=entry.count<=rule.limit;
    return {ok,remaining:Math.max(0,rule.limit-entry.count),retryAfter:ok?0:Math.ceil((entry.reset-now)/1000)};
  };
}

/** Respuesta 429 estándar (JSON con el mismo formato de error que el resto de la API). */
export function tooManyRequests(result:RateLimitResult,error="Demasiadas solicitudes. Espera un momento e inténtalo de nuevo."){
  return Response.json({ok:false,error},{status:429,headers:{"Retry-After":String(result.retryAfter)}});
}
