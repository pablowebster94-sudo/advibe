// Sesión del panel: cookies con el access/refresh token de Supabase Auth.
// Compatible con el runtime de middleware (solo fetch + atob).
export const SESSION_COOKIE="ev_session";
export const REFRESH_COOKIE="ev_refresh";
export const cookieOptions=(maxAge:number)=>({httpOnly:true,secure:true,sameSite:"lax" as const,path:"/",maxAge});
export const SESSION_MAX_AGE=60*60*24*7;
export const REFRESH_MAX_AGE=60*60*24*30;

/** Segundos de validez que le quedan a un JWT (sin verificar firma; solo para decidir si renovar). */
export function jwtSecondsLeft(token:string,now=Date.now()){
  try{
    const part=token.split(".")[1];
    const json=JSON.parse(atob(part.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(part.length/4)*4,"=")));
    return typeof json.exp==="number"?json.exp-Math.floor(now/1000):-1;
  }catch{return -1;}
}

export async function refreshSupabaseSession(refreshToken:string){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(!url||!key)return null;
  try{
    const r=await fetch(`${url}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:{"Content-Type":"application/json",apikey:key},body:JSON.stringify({refresh_token:refreshToken}),cache:"no-store"});
    if(!r.ok)return null;
    const d=await r.json() as {access_token?:string;refresh_token?:string};
    return d.access_token&&d.refresh_token?{access_token:d.access_token,refresh_token:d.refresh_token}:null;
  }catch{return null;}
}
