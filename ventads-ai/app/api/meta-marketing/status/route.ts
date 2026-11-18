import { NextResponse } from "next/server";
import { metaGet, safeError } from "@/lib/meta-marketing";

export const runtime = "nodejs";

export async function GET() {
  try {
    const me = await metaGet("me", { fields: "id,name" });
    const accounts = await metaGet("me/adaccounts", { fields: "id,name,account_status,currency,timezone_name", limit: "25" });
    return NextResponse.json({
      ok: true,
      connected: true,
      apiVersion: process.env.META_GRAPH_API_VERSION || "v27.0",
      user: { id: me.id, name: me.name },
      accounts: accounts.data || [],
    });
  } catch (error) {
    return safeError(error);
  }
}
