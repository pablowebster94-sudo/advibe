import { NextResponse } from "next/server";
import { supabaseAuthPassword, supabaseUserProfile } from "@/lib/enfoque-supabase";

export async function POST(req:Request) {
  try {
    const {email,password} = await req.json();
    if (!email || !password) return NextResponse.json({ok:false,error:"Correo y contraseña son obligatorios."},{status:400});
    const session = await supabaseAuthPassword(email,password);
    const profile = await supabaseUserProfile(session.access_token);
    if (!profile) return NextResponse.json({ok:false,error:"Este usuario no tiene acceso al panel."},{status:403});
    const response = NextResponse.json({ok:true});
    response.cookies.set("ev_session",session.access_token,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*8});
    return response;
  } catch {
    return NextResponse.json({ok:false,error:"No fue posible iniciar sesión."},{status:401});
  }
}
