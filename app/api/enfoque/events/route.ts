import { NextResponse } from "next/server";

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (normalize(body?.event_name) !== "Contact") {
      return NextResponse.json({ ok: false, error: "Evento no permitido" }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const attribution = {
      source: normalize(body?.utm_source),
      medium: normalize(body?.utm_medium),
      campaign: normalize(body?.utm_campaign),
      content: normalize(body?.utm_content),
      term: normalize(body?.utm_term),
      fbclid: normalize(body?.fbclid),
      gclid: normalize(body?.gclid),
      wbraid: normalize(body?.wbraid),
      gbraid: normalize(body?.gbraid),
    };

    const cookieHeader = req.headers.get("cookie") ?? "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(";")
        .map((item) => item.trim().split("="))
        .filter(([key, value]) => key && value)
    );

    const fbp = cookies["_fbp"];
    const fbc = cookies["_fbc"];
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    if (supabaseUrl && supabaseKey) {
      const lead = {
        content_id: normalize(body?.content_id),
        content_type: normalize(body?.content_type),
        value: typeof body?.value === "number" ? body.value : null,
        source: attribution.source,
        medium: attribution.medium,
        campaign: attribution.campaign,
        content: attribution.content,
        term: attribution.term,
        fbclid: attribution.fbclid,
        gclid: attribution.gclid,
        status: "contact",
      };

      const response = await fetch(supabaseUrl + "/rest/v1/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: "Bearer " + supabaseKey,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(lead),
      });

      if (!response.ok) {
        console.error("Supabase lead insert failed:", await response.text());
      }
    }

    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (pixelId && accessToken) {
      const metaResponse = await fetch(
        "https://graph.facebook.com/v23.0/" + pixelId + "/events",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: [
              {
                event_name: "Contact",
                event_time: Math.floor(Date.now() / 1000),
                action_source: "website",
                event_source_url: req.headers.get("referer") || undefined,
                user_data: {
                  client_ip_address: clientIp,
                  client_user_agent: userAgent,
                  fbp,
                  fbc,
                },
                custom_data: {
                  content_id: normalize(body?.content_id),
                  content_type: normalize(body?.content_type),
                  value: typeof body?.value === "number" ? body.value : undefined,
                  currency: "USD",
                  channel: "whatsapp",
                },
              },
            ],
            access_token: accessToken,
          }),
        }
      );

      if (!metaResponse.ok) {
        console.error("Meta CAPI error:", await metaResponse.text());
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  }
}
