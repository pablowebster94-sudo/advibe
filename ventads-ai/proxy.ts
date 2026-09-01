import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Whole-app Basic Auth. This is the only thing standing between an
 * unauthenticated visitor and `/api/campaigns` (which burns a real,
 * billable GEMINI_API_KEY call per creative) — see ARCHITECTURE.md ->
 * "Auth". Deliberately "simple y suficiente": one shared username/password
 * pair, not a real multi-user session system (that's `lib/auth.ts`'s demo
 * user, unrelated).
 *
 * Excluded: `/api/jobs/process` and `/api/cron/sweep`, which are called
 * server-to-server (self-chaining dispatch, Vercel Cron) with a
 * `Authorization: Bearer ${CRON_SECRET}` header — colliding that with
 * Basic Auth would break both mechanisms. They're independently
 * authenticated by `lib/auth.ts#isWorkerRequestAuthorized`, which fails
 * closed on its own.
 */
const BYPASS_PREFIXES = ["/api/jobs/process", "/api/cron/sweep"];

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still run a comparison of equal-length buffers so a length mismatch
    // doesn't return measurably faster than a same-length mismatch.
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
  if (BYPASS_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return NextResponse.next();
  }

  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    // Fails closed in production (never serve unauthenticated) but stays
    // out of the way for local dev where these are optional.
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[proxy] BASIC_AUTH_USER/BASIC_AUTH_PASSWORD not set — refusing all requests."
      );
      return new Response(
        "Server misconfigured: BASIC_AUTH_USER/BASIC_AUTH_PASSWORD not set.",
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
    const suppliedUser = separatorIndex === -1 ? decoded : decoded.slice(0, separatorIndex);
    const suppliedPassword = separatorIndex === -1 ? "" : decoded.slice(separatorIndex + 1);

    if (safeEqual(suppliedUser, expectedUser) && safeEqual(suppliedPassword, expectedPassword)) {
      return NextResponse.next();
    }
  }

  return unauthorized();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon).*)"],
};
