import { NextRequest, NextResponse } from "next/server";
export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0] ?? "";
  const isEV = host === "enfoque.advibeagencia.com" || host === "enfoquevisual.advibeagencia.com";
  const path = request.nextUrl.pathname;
  if (isEV && !path.startsWith("/enfoque-visual") && !path.startsWith("/api/") && !path.startsWith("/_next/")) {
    const url = request.nextUrl.clone(); url.pathname = "/enfoque-visual" + (path === "/" ? "" : path);
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };