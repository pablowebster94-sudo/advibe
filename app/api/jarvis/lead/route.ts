import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Reenvía los prospectos del sitio a JARVIS. Si JARVIS no está configurado o falla,
// el formulario sigue funcionando: el prospecto llega igual por WhatsApp o Calendly.
const rate = new Map<string, { count: number; resetAt: number }>();

function limitado(req: Request) {
  const key = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const now = Date.now();
  const actual = rate.get(key);
  if (!actual || actual.resetAt <= now) { rate.set(key, { count: 1, resetAt: now + 60_000 }); return false; }
  if (actual.count >= 10) return true;
  actual.count += 1;
  return false;
}

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (limitado(req)) return NextResponse.json({ ok: false }, { status: 429 });
  const url = process.env.JARVIS_URL;
  const secret = process.env.JARVIS_WEBHOOK_SECRET;
  if (!url || !secret) return NextResponse.json({ ok: false, error: "JARVIS no configurado" }, { status: 503 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (body.hp) return NextResponse.json({ ok: true }); // honeypot

  const lead = {
    name: texto(body.name, 120),
    company: texto(body.company, 160),
    website: texto(body.website, 500),
    phone: texto(body.phone, 40),
    email: texto(body.email, 254),
    service: texto(body.service, 200),
    budget: texto(body.budget, 100),
    event_id: texto(body.event_id, 100) || crypto.randomUUID(),
    event_source_url: texto(body.event_source_url, 1000),
    utm_source: texto(body.source, 100) || "advibeagencia.com",
  };
  if (lead.name.length < 2 || (!lead.phone && !lead.email)) return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });

  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/api/integrations/website-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!r.ok) console.error("[jarvis] rechazó el prospecto:", r.status);
    return NextResponse.json({ ok: r.ok });
  } catch (error) {
    console.error("[jarvis] no se pudo enviar el prospecto:", error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
