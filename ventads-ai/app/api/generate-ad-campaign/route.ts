
import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildProductBrief } from "@/lib/product-brief";
import { analyzeProduct } from "@/lib/services/analysis-engine";
import { generateAICampaign } from "@/lib/services/ai-orchestrator";
import { jsonRoute } from "@/lib/api-route";

export const runtime = "nodejs";
// The AI strategy/copy chain runs inside this request (bounded to ~40s by
// lib/services/ai-orchestrator.ts); without this, Vercel's default limit
// can kill it first and answer with an HTML error page instead of JSON.
export const maxDuration = 60;

const inputSchema = z.object({
  productId: z.string().optional(),
  clientDescription: z.string().max(5000).optional(),
  productDescription: z.string().max(5000).optional(),
  objective: z.string().min(1),
  budget: z.number().nonnegative().optional(),
  location: z.string().max(300).optional(),
  imageUrl: z.string().url().optional(),
  clientUrl: z.string().url().optional(),
});

async function handlePOST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Datos inválidos." },
      { status: 400 }
    );
  }

  if (!parsed.data.productId) {
    return NextResponse.json(
      { error: "productId es obligatorio para persistir la campaña en VentAds." },
      { status: 400 }
    );
  }

  const product = await prisma.product.findFirst({
    where: { id: parsed.data.productId, userId: user.id },
    include: { brand: true },
  });
  if (!product) return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });

  const brief = buildProductBrief(product, product.brand);
  const effectiveBrief = parsed.data.productDescription
    ? { ...brief, description: parsed.data.productDescription }
    : brief;
  const baseAnalysis = analyzeProduct(effectiveBrief, parsed.data.objective as never);

  const result = await generateAICampaign(effectiveBrief, baseAnalysis, {
    objective: parsed.data.objective,
    budget: parsed.data.budget,
    location: parsed.data.location,
    clientDescription: parsed.data.clientDescription,
    clientUrl: parsed.data.clientUrl,
  });

  return NextResponse.json({ success: true, data: result });
}

export const POST = jsonRoute("POST /api/generate-ad-campaign", handlePOST);
