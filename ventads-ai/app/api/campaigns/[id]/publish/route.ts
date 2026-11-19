/**
 * Publishes an approved campaign to Meta, always PAUSED.
 *
 * Today this always refuses, because the Meta connection is not configured
 * and the Graph API calls are not written. It refuses with the exact list of
 * what is missing, which is the useful answer — far better than a generic
 * failure, and better than pretending something was published.
 *
 * GET reports the connection status so the UI can explain it before the
 * operator clicks anything.
 */
import { NextResponse } from "next/server";
import { jsonRoute } from "@/lib/api-route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCampaignBriefInput } from "@/lib/campaign-brief";
import type { ObjectiveId } from "@/lib/catalog/objectives";
import {
  MetaNotConfiguredError,
  MetaNotImplementedError,
  metaConfiguration,
  publishPausedCampaign,
} from "@/lib/services/meta/meta-ads-service";
import { recommendStrategy } from "@/lib/services/strategy-service";

export const runtime = "nodejs";

async function loadCampaign(id: string) {
  const user = await getCurrentUser();
  return prisma.campaign.findFirst({
    where: { id, product: { userId: user.id } },
    include: { brief: true },
  });
}

async function handleGET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await loadCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  }
  const destinationId = campaign.brief
    ? toCampaignBriefInput(campaign.brief).destinationId
    : undefined;
  return NextResponse.json({
    approvalStatus: campaign.approvalStatus,
    meta: metaConfiguration(destinationId),
  });
}

async function handlePOST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await loadCampaign(id);
  if (!campaign) {
    return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  }
  if (campaign.approvalStatus !== "APPROVED") {
    return NextResponse.json(
      {
        error: "Solo se puede publicar una campaña aprobada.",
        code: "CAMPAIGN_NOT_APPROVED",
      },
      { status: 409 }
    );
  }
  if (!campaign.brief) {
    return NextResponse.json(
      { error: "Esta campaña no tiene brief.", code: "BRIEF_MISSING" },
      { status: 409 }
    );
  }

  const brief = toCampaignBriefInput(campaign.brief);
  const strategy = recommendStrategy(brief, campaign.objective as ObjectiveId);

  try {
    await publishPausedCampaign({
      campaignId: campaign.id,
      destinationId: brief.destinationId,
      metaObjective: strategy.recommended.metaObjective,
      dailyBudgetUsd: strategy.budget.dailyUsd ?? 0,
      adSets: strategy.recommended.structure.adSets,
    });
    // publishPausedCampaign never resolves today; kept so the success path
    // exists the moment it does.
    return NextResponse.json({ status: "PUBLICADA_PAUSADA" });
  } catch (error) {
    if (error instanceof MetaNotConfiguredError) {
      return NextResponse.json(
        { error: error.message, code: error.code, missing: error.missing },
        { status: 409 }
      );
    }
    if (error instanceof MetaNotImplementedError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 501 }
      );
    }
    throw error;
  }
}

export const GET = jsonRoute("GET /api/campaigns/[id]/publish", handleGET);
export const POST = jsonRoute("POST /api/campaigns/[id]/publish", handlePOST);
