/**
 * The campaign brief of the SaleADS-style flow.
 *
 *   GET  -> the saved brief plus the strategy it currently implies
 *   PUT  -> saves a partial brief and answers with the recomputed strategy
 *
 * PUT is a patch, not a replace: the flow autosaves one field at a time, so
 * an absent key must leave its column alone. The strategy is never stored
 * here — it is derived on every read, so editing the brief can never leave a
 * stale plan on screen. It is persisted only when the operator approves the
 * campaign (see the approve route).
 */
import { NextResponse } from "next/server";
import { jsonRoute } from "@/lib/api-route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCampaignBriefInput, toCampaignBriefPatch } from "@/lib/campaign-brief";
import type { ObjectiveId } from "@/lib/catalog/objectives";
import { recommendStrategy } from "@/lib/services/strategy-service";

export const runtime = "nodejs";

/** Loads the campaign only if it belongs to the caller. */
async function ownedCampaign(id: string) {
  const user = await getCurrentUser();
  return prisma.campaign.findFirst({
    where: { id, product: { userId: user.id } },
    include: { brief: true },
  });
}

/** An unsaved brief reads as an empty one, so the UI has the same shape
 *  whether or not the operator has typed anything yet. */
const EMPTY_BRIEF = {
  offerSummary: "",
  priceDisplay: null,
  benefits: "[]",
  restrictions: null,
  destinationId: "WHATSAPP",
  whatsappNumber: null,
  landingUrl: null,
  phoneNumber: null,
  countries: "[]",
  cities: "[]",
  radiusKm: null,
  language: null,
  audienceNotes: null,
  dailyBudgetUsd: null,
  lifetimeBudgetUsd: null,
  durationDays: null,
} as const;

function payload(campaign: { objective: string; approvalStatus: string }, briefRow: unknown) {
  const brief = toCampaignBriefInput({ ...EMPTY_BRIEF, ...(briefRow ?? {}) } as never);
  const strategy = recommendStrategy(brief, campaign.objective as ObjectiveId);
  return { brief, strategy, approvalStatus: campaign.approvalStatus };
}

async function handleGET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await ownedCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  }
  return NextResponse.json(payload(campaign, campaign.brief));
}

async function handlePUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await ownedCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  }
  // An approved campaign's brief is what was approved. Editing it would make
  // the stored strategy a lie, so the operator must reopen the draft first.
  if (campaign.approvalStatus !== "DRAFT") {
    return NextResponse.json(
      {
        error:
          "Esta campaña ya fue aprobada. Vuélvela a borrador para editar el brief.",
        code: "CAMPAIGN_NOT_DRAFT",
      },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo debe ser JSON." }, { status: 400 });
  }

  const patch = toCampaignBriefPatch(body);
  const brief = await prisma.campaignBrief.upsert({
    where: { campaignId: id },
    create: { campaignId: id, ...patch },
    update: patch,
  });

  return NextResponse.json(payload(campaign, brief));
}

export const GET = jsonRoute("GET /api/campaigns/[id]/brief", handleGET);
export const PUT = jsonRoute("PUT /api/campaigns/[id]/brief", handlePUT);
