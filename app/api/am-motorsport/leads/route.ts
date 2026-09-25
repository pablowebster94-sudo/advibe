import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body?.name || !body?.phone || !body?.vehicle) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[AM-MOTORSPORT-LEAD] Supabase environment variables are missing");
      return NextResponse.json(
        { ok: false, error: "Lead storage is not configured" },
        { status: 500 }
      );
    }

    const eventId = crypto.randomUUID();

    const lead = {
      vehicle: body.vehicle,
      vehicle_slug: body.vehicleSlug || "",
      name: body.name.trim(),
      phone: body.phone.trim(),
      answers: body.answers || {},
      score: body.score || "COLD",
      utm: body.utm || {},
      page: body.page || null,
      source: "am-motorsport-drive",
      status: "new",
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/am_motorsport_leads`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(lead),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const details = await response.text();
      console.error("[AM-MOTORSPORT-LEAD] Supabase insert failed", details);
      return NextResponse.json(
        { ok: false, error: "Could not save lead" },
        { status: 500 }
      );
    }

    console.log("[AM-MOTORSPORT-LEAD] Saved", JSON.stringify(lead));

    return NextResponse.json({ ok: true, eventId });
  } catch (error) {
    console.error("[AM-MOTORSPORT-LEAD] Unexpected error", error);
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
