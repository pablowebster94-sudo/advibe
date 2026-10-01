import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withResolvedConcepts, withResolvedImageUrl } from "@/lib/serialize";
import { jsonRoute } from "@/lib/api-route";
import { dispatchWorkers } from "@/lib/services/job-dispatch";
import { isCampaignStalled, reclaimAbandonedJobs } from "@/lib/services/job-queue";

export const runtime = "nodejs";

async function handleGET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id, product: { userId: user.id } },
    include: {
      product: { include: { images: true, brand: true } },
      concepts: {
        include: {
          copy: true,
          creatives: { orderBy: { version: "desc" } },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  }

  // Self-heal: the results page polls this route while a campaign renders.
  // If its worker chain has stopped (e.g. a self-kick was dropped), restart
  // it from this fresh request instead of waiting for the daily cron sweep.
  // A job whose worker died mid-flight stays PROCESSING; requeue it (or fail
  // it once out of attempts) so one dead worker can't block the campaign.
  if (campaign.status === "PENDING") {
    const reclaimed = await reclaimAbandonedJobs({ campaignId: campaign.id });
    if (reclaimed.failed > 0) {
      const { finalizeCampaignIfDone } = await import("@/lib/services/campaign-service");
      await finalizeCampaignIfDone(campaign.id);
    }
    if (await isCampaignStalled(campaign.id)) dispatchWorkers(campaign.id, 1);
  }

  const concepts = await withResolvedConcepts(campaign.concepts);
  const productImages = await Promise.all(campaign.product.images.map(withResolvedImageUrl));

  return NextResponse.json({
    campaign: { ...campaign, concepts, product: { ...campaign.product, images: productImages } },
  });
}

export const GET = jsonRoute("GET /api/campaigns/:id", handleGET);
