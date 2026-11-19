/**
 * Generates the campaign's concepts, copy and creatives from the brief.
 *
 * Refuses while the brief still has a blocking gap: generating ads from an
 * incomplete offer would force the engines to either invent facts or leave
 * holes, and both waste the operator's time and the image provider's quota.
 */
import { NextResponse } from "next/server";
import { jsonRoute } from "@/lib/api-route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCampaignBriefInput } from "@/lib/campaign-brief";
import type { ObjectiveId } from "@/lib/catalog/objectives";
import { createCampaignJobs } from "@/lib/services/campaign-service";
import { recommendStrategy } from "@/lib/services/strategy-service";

export const runtime = "nodejs";

async function handlePOST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id, product: { userId: user.id } },
    include: { brief: true },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  }
  if (!campaign.brief) {
    return NextResponse.json(
      { error: "Esta campaña todavía no tiene brief.", code: "BRIEF_MISSING" },
      { status: 409 }
    );
  }

  const brief = toCampaignBriefInput(campaign.brief);
  const strategy = recommendStrategy(brief, campaign.objective as ObjectiveId);
  const blocking = strategy.missingInfo.filter((m) => m.blocking);
  if (blocking.length > 0) {
    return NextResponse.json(
      {
        error: "Faltan datos para generar los anuncios.",
        code: "BRIEF_INCOMPLETE",
        missing: blocking,
      },
      { status: 409 }
    );
  }

  // Rendering is asynchronous: this returns once the strategy and copy are
  // persisted, and the results screen polls for the images.
  await createCampaignJobs(campaign.id);

  return NextResponse.json({ status: "GENERANDO", campaignId: campaign.id }, { status: 202 });
}

export const POST = jsonRoute("POST /api/campaigns/[id]/generate", handlePOST);
