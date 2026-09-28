import {NextResponse} from "next/server";
export async function POST(req:Request){const response=NextResponse.redirect(new URL("/enfoque-visual/admin/login",req.url),303);response.cookies.set("ev_session","",{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:0});return response;}
