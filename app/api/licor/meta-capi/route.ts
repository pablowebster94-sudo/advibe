import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

/**
 * Meta Conversions API relay.
 *
 * Sends the server-side twin of each browser Pixel event, deduplicated by
 * `event_id`. Nothing is sent — and no error is raised — unless both of these
 * are configured, so the storefront runs fine without an ad account:
 *
 *   NEXT_PUBLIC_META_PIXEL_ID   the pixel / dataset id (also used by the browser)
 *   META_CAPI_ACCESS_TOKEN      server-only access token (never exposed to the client)
 *   META_CAPI_TEST_EVENT_CODE   optional, for Events Manager test traffic
 *   META_GRAPH_API_VERSION      optional, defaults to v21.0
 *
 * No credentials are hardcoded anywhere in this repository.
 */

export const dynamic = "force-dynamic";

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";

export async function POST(request: Request) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  let body: {
    eventName?: string;
    eventId?: string;
    eventSourceUrl?: string;
    customData?: Record<string, unknown>;
    userData?: { email?: string; phone?: string };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid body." }, { status: 400 });
  }

  if (!body.eventName) {
    return NextResponse.json({ ok: false, error: "Missing eventName." }, { status: 400 });
  }

  // Not configured yet — accept and drop, so the client never sees an error.
  if (!pixelId || !accessToken) {
    return NextResponse.json({ ok: true, forwarded: false, reason: "not-configured" });
  }

  const headers = request.headers;
  const clientIp =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    undefined;

  const payload = {
    data: [
      {
        event_name: body.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: body.eventId,
        event_source_url: body.eventSourceUrl,
        action_source: "website",
        user_data: {
          client_user_agent: headers.get("user-agent") ?? undefined,
          client_ip_address: clientIp,
          // Meta requires customer data to be SHA-256 hashed.
          em: hash(body.userData?.email),
          ph: hash(body.userData?.phone?.replace(/\D/g, "")),
        },
        custom_data: body.customData ?? {},
      },
    ],
    ...(process.env.META_CAPI_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_CAPI_TEST_EVENT_CODE }
      : {}),
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      console.warn("[licor/meta-capi] rejected by Meta", response.status, detail);
      return NextResponse.json({ ok: false, forwarded: false }, { status: 202 });
    }

    return NextResponse.json({ ok: true, forwarded: true });
  } catch (error) {
    console.warn("[licor/meta-capi] request failed", error);
    // Analytics failures must never surface to the shopper.
    return NextResponse.json({ ok: false, forwarded: false }, { status: 202 });
  }
}

function hash(value?: string): string | undefined {
  if (!value) return undefined;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}
