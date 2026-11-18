import { NextResponse } from "next/server";
import { metaGet, safeError } from "@/lib/meta-marketing";

export const runtime = "nodejs";

export async function GET() {
  try {
    const result = await metaGet("me/adaccounts", {
      fields: "id,name,account_status,currency,timezone_name,business",
      limit: "100",
    });
    return NextResponse.json({ ok: true, accounts: result.data || [] });
  } catch (error) {
    return safeError(error);
  }
}
