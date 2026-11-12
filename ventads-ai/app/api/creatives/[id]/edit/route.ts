import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withResolvedCreativeUrl } from "@/lib/serialize";
import { interpretCreativeEdit } from "@/lib/services/creative-director";
import { jsonRoute } from "@/lib/api-route";

export const runtime = "nodejs";

const inputSchema = z.object({
  instruction: z.string().trim().min(2).max(1200),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1200) })).max(16).optional(),
});

async function handlePOST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Instrucción inválida." }, { status: 400 });
  }

  const creative = await prisma.creative.findFirst({
    where: { id, concept: { campaign: { product: { userId: user.id } } } },
    include: {
      concept: { include: { copy: true, campaign: { include: { product: true } } } },
    },
  });
  if (!creative?.concept.copy) {
    return NextResponse.json({ error: "No se encontró la creatividad o su copy." }, { status: 404 });
  }

  const copy = creative.concept.copy;
  const campaign = creative.concept.campaign;
  const edit = await interpretCreativeEdit({
    instruction: parsed.data.instruction,
    history: parsed.data.history,
    current: {
      headline: copy.headline,
      description: copy.description,
      cta: copy.cta,
      visualPrompt: copy.visualPrompt,
      styleId: campaign.style,
      productName: campaign.product.name,
    },
  });

  const copyPatch: Record<string, string> = {};
  if (edit.headline) copyPatch.headline = edit.headline;
  if (edit.description) copyPatch.description = edit.description;
  if (edit.cta) copyPatch.cta = edit.cta;
  if (edit.visualPrompt) copyPatch.visualPrompt = edit.visualPrompt;
  if (Object.keys(copyPatch).length) {
    await prisma.copyVariant.update({ where: { id: copy.id }, data: copyPatch });
  }
  if (edit.styleId) {
    await prisma.campaign.update({ where: { id: campaign.id }, data: { style: edit.styleId } });
  }
  if (edit.removePrice) {
    await prisma.product.update({ where: { id: campaign.product.id }, data: { price: null, priceLabel: null } });
  }

  try {
    const { regenerateCreative } = await import("@/lib/services/campaign-service");
    const created = await regenerateCreative(id);
    return NextResponse.json({
      creative: await withResolvedCreativeUrl(created),
      message: "Cambios aplicados. Estoy generando la nueva versión.",
    }, { status: 202 });
  } catch (error) {
    console.error("Creative edit failed", error);
    return NextResponse.json({ error: "No se pudo iniciar la nueva versión." }, { status: 500 });
  }
}

export const POST = jsonRoute("POST /api/creatives/:id/edit", handlePOST);
