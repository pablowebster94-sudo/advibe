import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withResolvedConcepts, withResolvedImageUrl } from "@/lib/serialize";
import { jsonRoute } from "@/lib/api-route";

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

  const concepts = await withResolvedConcepts(campaign.concepts);
  const productImages = await Promise.all(campaign.product.images.map(withResolvedImageUrl));

  return NextResponse.json({
    campaign: { ...campaign, concepts, product: { ...campaign.product, images: productImages } },
  });
}

export const GET = jsonRoute("GET /api/campaigns/:id", handleGET);
