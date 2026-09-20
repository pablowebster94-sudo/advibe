import {cookies} from "next/headers";
import {supabaseUserProfile,supabasePublic} from "@/lib/enfoque-supabase";
import {supabaseAdmin} from "@/lib/enfoque-supabase";

export async function getAdminSession(){
  const token=(await cookies()).get("ev_session")?.value;
  if(!token) return null;
  const profile=await supabaseUserProfile(token).catch(()=>null);
  return profile ? {token,profile} : null;
}
export async function adminGet<T>(path:string,token:string){return supabaseAdmin<T>(path,{headers:{"Prefer":"return=representation"}},token);}
