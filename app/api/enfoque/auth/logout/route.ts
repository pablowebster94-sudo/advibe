import {NextResponse} from "next/server";
import {REFRESH_COOKIE,SESSION_COOKIE,cookieOptions} from "@/lib/enfoque-session";

export async function POST(req:Request){
  const token=req.headers.get("cookie")?.match(new RegExp(`(?:^|; )${SESSION_COOKIE}=([^;]+)`))?.[1];
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||process.env.SUPABASE_URL;const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Revoca el refresh token en Supabase; si falla, igual se borran las cookies.
  if(token&&url&&key)await fetch(`${url}/auth/v1/logout`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${token}`}}).catch(()=>{});
  const response=NextResponse.redirect(new URL("/enfoque-visual/admin/login",req.url),303);
  response.cookies.set(SESSION_COOKIE,"",cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE,"",cookieOptions(0));
  return response;
}
