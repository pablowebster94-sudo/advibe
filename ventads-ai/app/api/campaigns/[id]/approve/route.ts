/**
 * Approval gate. Nothing in this product may reach Meta from a campaign that
 * is not APPROVED, and approving freezes the strategy that was approved, so
 * the decision stays explainable after the engine's heuristics change.
 *
 *   POST { action: "approve" }  DRAFT    -> APPROVED
 *   POST { action: "reopen"  }  APPROVED -> DRAFT
 */
import { NextResponse } from "next/server";
import { jsonRoute } from "@/lib/api-route";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toCampaignBriefInput } from "@/lib/campaign-brief";
import type { ObjectiveId } from "@/lib/catalog/objectives";
import { recommendStrategy } from "@/lib/services/strategy-service";

export const runtime = "nodejs";

async function handlePOST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  let action: unknown = "approve";
  try {
    action = ((await request.json()) as { action?: unknown })?.action ?? "approve";
  } catch {
    // An empty body means approve, the common case.
  }
  if (action !== "approve" && action !== "reopen") {
    return NextResponse.json(
      { error: 'action debe ser "approve" o "reopen".' },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.findFirst({
    where: { id, product: { userId: user.id } },
    include: { brief: true },
  });
  if (!campaign) {
    return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  }

  if (action === "reopen") {
    // The frozen strategy is cleared with the approval it belonged to, so a
    // reopened draft can never show a plan that nobody approved.
    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { approvalStatus: "DRAFT", approvedAt: null, strategy: null },
    });
    return NextResponse.json({ approvalStatus: updated.approvalStatus });
  }

  if (campaign.approvalStatus !== "DRAFT") {
    return NextResponse.json(
      { error: "Esta campaña ya fue aprobada.", code: "CAMPAIGN_NOT_DRAFT" },
      { status: 409 }
    );
  }
  if (!campaign.brief) {
    return NextResponse.json(
      { error: "Esta campaña todavía no tiene brief.", code: "BRIEF_MISSING" },
      { status: 409 }
    );
  }

  const strategy = recommendStrategy(
    toCampaignBriefInput(campaign.brief),
    campaign.objective as ObjectiveId
  );
  const blocking = strategy.missingInfo.filter((m) => m.blocking);
  if (blocking.length > 0) {
    return NextResponse.json(
      {
        error: "No se puede aprobar: faltan datos obligatorios.",
        code: "BRIEF_INCOMPLETE",
        missing: blocking,
      },
      { status: 409 }
    );
  }

  const updated = await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      approvalStatus: "APPROVED",
      approvedAt: new Date(),
      strategy: JSON.stringify(strategy),
    },
  });

  return NextResponse.json({
    approvalStatus: updated.approvalStatus,
    approvedAt: updated.approvedAt,
    strategy,
  });
}

export const POST = jsonRoute("POST /api/campaigns/[id]/approve", handlePOST);
