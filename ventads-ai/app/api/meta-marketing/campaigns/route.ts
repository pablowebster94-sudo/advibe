import { NextResponse } from "next/server";
import { metaPost, safeError } from "@/lib/meta-marketing";

export const runtime = "nodejs";

const allowedObjectives = new Set([
  "OUTCOME_TRAFFIC",
  "OUTCOME_ENGAGEMENT",
  "OUTCOME_LEADS",
  "OUTCOME_SALES",
  "OUTCOME_APP_PROMOTION",
  "OUTCOME_AWARENESS",
]);

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const accountId = String(input.accountId || "").replace(/^act_/, "");
    const name = String(input.name || "").trim();
    const objective = String(input.objective || "");
    const specialAdCategories = Array.isArray(input.specialAdCategories) ? input.specialAdCategories : [];

    if (!/^\d+$/.test(accountId)) return NextResponse.json({ ok: false, error: "Invalid ad account ID." }, { status: 400 });
    if (!name || name.length > 200) return NextResponse.json({ ok: false, error: "Campaign name is required (max 200 chars)." }, { status: 400 });
    if (!allowedObjectives.has(objective)) return NextResponse.json({ ok: false, error: "Unsupported campaign objective." }, { status: 400 });
    if (!specialAdCategories.every((category: unknown) => typeof category === "string")) return NextResponse.json({ ok: false, error: "Invalid special ad category list." }, { status: 400 });

    // Create in PAUSED state only: creation is not publication.
    const campaign = await metaPost(`act_${accountId}/campaigns`, {
      name,
      objective,
      status: "PAUSED",
      buying_type: "AUCTION",
      special_ad_categories: JSON.stringify(specialAdCategories),
    });
    return NextResponse.json({ ok: true, campaign, status: "PAUSED", requiresReviewBeforePublishing: true });
  } catch (error) {
    return safeError(error);
  }
}
