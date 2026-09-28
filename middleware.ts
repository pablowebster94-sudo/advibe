import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE, REFRESH_MAX_AGE, SESSION_COOKIE, SESSION_MAX_AGE, cookieOptions, jwtSecondsLeft, refreshSupabaseSession } from "@/lib/enfoque-session";

function clean(value:string|null) {
  return value ? value.slice(0,255) : "";
}

function isEnfoqueAdmin(path:string, isEV:boolean) {
  return path.startsWith("/enfoque-visual/admin") || path.startsWith("/api/enfoque/admin") || (isEV && path.startsWith("/admin"));
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const isEV = host === "enfoque.advibeagencia.com" || host === "enfoquevisual.advibeagencia.com";
  const path = request.nextUrl.pathname;
  const cookies: Array<[string,string,number]> = [];

  const keys=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid"];
  const incoming=Object.fromEntries(keys.map(k=>[k,clean(request.nextUrl.searchParams.get(k))]).filter(([,v])=>v));
  if (Object.keys(incoming).length) {
    const current=request.cookies.get("ev_attr")?.value;
    let parsed:{first_touch?:unknown}={};
    try { parsed=current ? JSON.parse(decodeURIComponent(current)) : {}; } catch {}
    // ts: momento del clic; Meta lo usa para construir _fbc desde fbclid si el Pixel está bloqueado.
    const touch={...incoming,ts:Date.now()};
    const payload={first_touch:parsed.first_touch || touch,last_touch:touch,landing_url:request.url,referrer:request.headers.get("referer") || null};
    cookies.push(["ev_attr",encodeURIComponent(JSON.stringify(payload)),60*60*24*30]);
  }
  if (!request.cookies.get("ev_vid")?.value) cookies.push(["ev_vid",crypto.randomUUID(),60*60*24*365]);

  // Panel de Enfoque: renueva el access token de Supabase (dura 1 h) con el refresh token.
  const requestHeaders = new Headers(request.headers);
  if (isEnfoqueAdmin(path,isEV)) {
    const access = request.cookies.get(SESSION_COOKIE)?.value;
    const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
    if (refresh && (!access || jwtSecondsLeft(access) < 120)) {
      const session = await refreshSupabaseSession(refresh);
      if (session) {
        cookies.push([SESSION_COOKIE,session.access_token,SESSION_MAX_AGE],[REFRESH_COOKIE,session.refresh_token,REFRESH_MAX_AGE]);
        request.cookies.set(SESSION_COOKIE,session.access_token);
        request.cookies.set(REFRESH_COOKIE,session.refresh_token);
        requestHeaders.set("cookie",request.cookies.toString());
      }
    }
  }

  let response: NextResponse;
  if (isEV && !path.startsWith("/enfoque-visual") && !path.startsWith("/api/") && !path.startsWith("/_next/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/enfoque-visual" + (path === "/" ? "" : path);
    response = NextResponse.rewrite(url,{request:{headers:requestHeaders}});
  } else {
    response = NextResponse.next({request:{headers:requestHeaders}});
  }
  for (const [name,value,maxAge] of cookies) response.cookies.set(name,value,cookieOptions(maxAge));
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
