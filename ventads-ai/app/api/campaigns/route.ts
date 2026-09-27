import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withResolvedConcepts } from "@/lib/serialize";
import { campaignInputSchema } from "@/lib/validation";
import { jsonRoute } from "@/lib/api-route";
import { errorCode } from "@/lib/error-code";

export const runtime = "nodejs";
// The AI strategy/copy chain runs inside this request (bounded to ~40s by
// lib/services/ai-orchestrator.ts); without this, Vercel's default limit
// can kill it first and answer with an HTML error page instead of JSON.
export const maxDuration = 60;

const campaignInclude = {
  concepts: {
    include: { copy: true, creatives: { orderBy: { version: "desc" as const } } },
  },
} as const;

async function handlePOST(request: Request) {
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
    // Loaded inside the handler: it pulls in sharp (native), and a module-load
    // failure there must still answer JSON through jsonRoute, never an HTML 500.
    const { createCampaignJobs } = await import("@/lib/services/campaign-service");
    await createCampaignJobs(campaign.id);
  } catch (error) {
    console.error("Campaign setup failed", error);
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "No se pudo preparar la campaña.", code: errorCode(error) },
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

export const POST = jsonRoute("POST /api/campaigns", handlePOST);
