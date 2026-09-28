import {cookies} from "next/headers";
import {supabaseAdmin,supabaseUserProfile} from "@/lib/enfoque-supabase";
import {SESSION_COOKIE} from "@/lib/enfoque-session";

export async function getAdminSession(){
  const token=(await cookies()).get(SESSION_COOKIE)?.value;
  if(!token) return null;
  const profile=await supabaseUserProfile(token).catch(()=>null);
  return profile ? {token,profile} : null;
}
export async function adminGet<T>(path:string,token:string){return supabaseAdmin<T>(path,{},token);}

/** Lectura para páginas del panel: nunca lanza; devuelve el error para mostrarlo. */
export async function adminTry<T>(path:string,token:string,fallback:T):Promise<{data:T;error:string|null}>{
  try{return {data:await adminGet<T>(path,token),error:null};}
  catch(e){return {data:fallback,error:String((e as Error)?.message||e).slice(0,200)};}
}

export const isoDaysAgo=(days:number)=>new Date(Date.now()-days*864e5).toISOString();
