import { NextResponse } from "next/server";
import { supabaseAuthPassword, supabaseUserProfile } from "@/lib/enfoque-supabase";
import { REFRESH_COOKIE, REFRESH_MAX_AGE, SESSION_COOKIE, SESSION_MAX_AGE, cookieOptions } from "@/lib/enfoque-session";

export async function POST(req:Request) {
  try {
    const {email,password} = await req.json();
    if (!email || !password) return NextResponse.json({ok:false,error:"Correo y contraseña son obligatorios."},{status:400});
    const session = await supabaseAuthPassword(String(email).trim(),String(password));
    const profile = await supabaseUserProfile(session.access_token);
    if (!profile) return NextResponse.json({ok:false,error:"Este usuario no tiene acceso al panel."},{status:403});
    const response = NextResponse.json({ok:true});
    response.cookies.set(SESSION_COOKIE,session.access_token,cookieOptions(SESSION_MAX_AGE));
    response.cookies.set(REFRESH_COOKIE,session.refresh_token,cookieOptions(REFRESH_MAX_AGE));
    return response;
  } catch (error) {
    const message = String((error as Error)?.message||"");
    if (message.includes("not configured")) return NextResponse.json({ok:false,error:"El acceso no está configurado en el servidor (Supabase Auth)."},{status:503});
    if (message === "Credenciales inválidas") return NextResponse.json({ok:false,error:"Correo o contraseña incorrectos."},{status:401});
    console.error("[enfoque] Login: Supabase no responde:",error);
    return NextResponse.json({ok:false,error:"No se pudo conectar con el servicio de acceso. Intenta en unos minutos."},{status:503});
  }
}
