import { NextRequest, NextResponse } from "next/server";

function clean(value:string|null) {
  return value ? value.slice(0,255) : "";
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const isEV = host === "enfoque.advibeagencia.com" || host === "enfoquevisual.advibeagencia.com";
  const path = request.nextUrl.pathname;
  const response = NextResponse.next();

  const keys=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid"];
  const incoming=Object.fromEntries(keys.map(k=>[k,clean(request.nextUrl.searchParams.get(k))]).filter(([,v])=>v));
  if (Object.keys(incoming).length) {
    const current=request.cookies.get("ev_attr")?.value;
    let parsed:any={};
    try { parsed=current ? JSON.parse(decodeURIComponent(current)) : {}; } catch {}
    const touch={...incoming};
    const payload={first_touch:parsed.first_touch || touch,last_touch:touch,landing_url:request.url,referrer:request.headers.get("referer") || null};
    response.cookies.set("ev_attr",encodeURIComponent(JSON.stringify(payload)),{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*24*30});
  }
  if (!request.cookies.get("ev_vid")?.value) {
    response.cookies.set("ev_vid",crypto.randomUUID(),{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:60*60*24*365});
  }

  if (isEV && !path.startsWith("/enfoque-visual") && !path.startsWith("/api/") && !path.startsWith("/_next/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/enfoque-visual" + (path === "/" ? "" : path);
    return NextResponse.rewrite(url,response);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
