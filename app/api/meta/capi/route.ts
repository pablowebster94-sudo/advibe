import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";

const META_GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v26.0";

function hash(value: string) {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export async function POST(request: NextRequest) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    return NextResponse.json({ ok: false, configured: false }, { status: 503 });
  }

  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email : "";
    const phone = typeof body.phone === "string" ? body.phone : "";
    const eventId = typeof body.event_id === "string" ? body.event_id : crypto.randomUUID();
    const eventName = typeof body.event_name === "string" ? body.event_name : "Lead";
    const eventSourceUrl = typeof body.event_source_url === "string"
      ? body.event_source_url
      : "https://www.advibeagencia.com/diagnostico";

    const userData: Record<string, unknown> = {
      client_user_agent: request.headers.get("user-agent") || undefined,
      client_ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      fbp: typeof body.fbp === "string" ? body.fbp : undefined,
      fbc: typeof body.fbc === "string" ? body.fbc : undefined,
    };

    if (email) userData.em = [hash(email)];
    if (phone) userData.ph = [hash(phone.replace(/\\D/g, ""))];

    const event = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: eventSourceUrl,
      user_data: userData,
      custom_data: {
        content_name: "Diagnóstico digital AdVibe",
        content_category: "lead_generation",
      },
    };

    const response = await fetch(
      `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: [event] }),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ ok: false, error: result }, { status: 502 });
    }

    return NextResponse.json({ ok: true, event_id: eventId, result });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
