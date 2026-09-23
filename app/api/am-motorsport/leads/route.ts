import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.name || !body?.phone || !body?.vehicle) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // MVP: log estructurado para Vercel. El siguiente paso puede persistir
    // directamente en Supabase y disparar una notificación al vendedor.
    console.log("[AM-MOTORSPORT-LEAD]", JSON.stringify({
      vehicle: body.vehicle,
      vehicleSlug: body.vehicleSlug,
      name: body.name,
      phone: body.phone,
      answers: body.answers,
      score: body.score,
      utm: body.utm,
      page: body.page,
      createdAt: body.createdAt,
    }));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
}
