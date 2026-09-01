import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withResolvedConcepts } from "@/lib/serialize";
import { createCampaignJobs } from "@/lib/services/campaign-service";
import { campaignInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

const campaignInclude = {
  concepts: {
    include: { copy: true, creatives: { orderBy: { version: "desc" as const } } },
  },
} as const;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = campaignInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, userId: user.id },
  });
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      productId: product.id,
      objective: parsed.data.objective,
      style: parsed.data.style,
    },
  });

  try {
    // Fast, local, synchronous: creates Concepts/CopyVariants + PENDING
    // Creative jobs, and dispatches the background workers. No image
    // generation happens in this request.
    await createCampaignJobs(campaign.id);
  } catch (error) {
    console.error("Campaign setup failed", error);
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "No se pudo preparar la campaña." },
      { status: 500 }
    );
  }

  const result = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaign.id },
    include: campaignInclude,
  });

  return NextResponse.json(
    { campaign: { ...result, concepts: await withResolvedConcepts(result.concepts) } },
    { status: 201 }
  );
}
