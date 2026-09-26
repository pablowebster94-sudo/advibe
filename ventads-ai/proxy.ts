import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Whole-app Basic Auth.
 *
 * Preferred credentials:
 *   BASIC_AUTH_USER / BASIC_AUTH_PASSWORD
 *
 * Safe production fallback:
 *   if the explicit pair is absent, CRON_SECRET is used as the password
 *   with the fixed username "advibe". This keeps the app fail-closed
 *   without requiring a second secret solely for the UI gate.
 *
 * The worker/cron endpoints below bypass Basic Auth because they have their
 * own independent Bearer CRON_SECRET authentication.
 */
const BYPASS_PREFIXES = ["/api/jobs/process", "/api/cron/sweep"];
const FALLBACK_AUTH_USER = "advibe";

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function unauthorized() {
  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="ventADS.ai"' },
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    BYPASS_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return NextResponse.next();
  }

  const explicitUser = process.env.BASIC_AUTH_USER;
  const explicitPassword = process.env.BASIC_AUTH_PASSWORD;
  const fallbackPassword = process.env.CRON_SECRET;

  const expectedUser = explicitUser || (fallbackPassword ? FALLBACK_AUTH_USER : "");
  const expectedPassword = explicitPassword || fallbackPassword;

  // Production remains fail-closed. We never silently expose the app.
  if (!expectedUser || !expectedPassword) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[proxy] No UI authentication secret configured. Set BASIC_AUTH_USER/BASIC_AUTH_PASSWORD or CRON_SECRET."
      );
      return new Response(
        "Server misconfigured: UI authentication secret is not configured.",
        { status: 500 }
      );
    }
    return NextResponse.next();
  }

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    let decoded: string;

    try {
      decoded = Buffer.from(header.slice("Basic ".length), "base64").toString("utf8");
    } catch {
      return unauthorized();
    }

    const separatorIndex = decoded.indexOf(":");
    const suppliedUser =
      separatorIndex === -1 ? decoded : decoded.slice(0, separatorIndex);
    const suppliedPassword =
      separatorIndex === -1 ? "" : decoded.slice(separatorIndex + 1);

    if (
      safeEqual(suppliedUser, expectedUser) &&
      safeEqual(suppliedPassword, expectedPassword)
    ) {
      return NextResponse.next();
    }
  }

  return unauthorized();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon).*)"],
};
