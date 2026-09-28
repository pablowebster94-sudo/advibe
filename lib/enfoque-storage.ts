// Operaciones de Storage (bucket listing-media) con service role. Solo servidor.
const BUCKET="listing-media";
function base(){return (process.env.SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||"").replace(/\/$/,"");}
function headers(extra:Record<string,string>={}){
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY||"";
  return {"Authorization":"Bearer "+key,"apikey":key,...extra};
}
export function storageConfigured(){return Boolean(base()&&process.env.SUPABASE_SERVICE_ROLE_KEY);}

export async function uploadObject(path:string,body:ArrayBuffer,contentType:string){
  const r=await fetch(`${base()}/storage/v1/object/${BUCKET}/${path}`,{method:"POST",headers:headers({"Content-Type":contentType,"x-upsert":"false","Cache-Control":"max-age=31536000"}),body});
  if(!r.ok)throw new Error(`Storage ${r.status}: ${await r.text()}`);
}

/** Borra varios objetos; ignora los que ya no existen. */
export async function removeObjects(paths:string[]){
  if(!paths.length)return true;
  const r=await fetch(`${base()}/storage/v1/object/${BUCKET}`,{method:"DELETE",headers:headers({"Content-Type":"application/json"}),body:JSON.stringify({prefixes:paths})});
  if(!r.ok&&r.status!==404){console.error("[enfoque] No se pudieron borrar archivos de Storage:",r.status,await r.text());return false;}
  return true;
}
