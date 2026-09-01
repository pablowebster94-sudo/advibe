import { FORMATS } from "@/lib/catalog/formats";
import type { ObjectiveId } from "@/lib/catalog/objectives";
import type { Creative } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { buildProductBrief } from "@/lib/product-brief";
import { analyzeProduct } from "@/lib/services/analysis-engine";
import { buildConcepts } from "@/lib/services/concept-engine";
import { generateCopy } from "@/lib/services/copy-service";
import { activeImageProviderName, imageGeneration } from "@/lib/services/image-generation";
import { currentJobConcurrency, dispatchWorkers } from "@/lib/services/job-dispatch";
import { storage } from "@/lib/services/storage";

function keyFromUrl(url: string) {
  return url.replace(/^\/api\/files\//, "");
}

// Backoff before a retriable job becomes claimable again, indexed by
// attempts-so-far (1st failure -> 10s, 2nd -> 60s, 3rd+ -> 300s). Keeps a
// transient Gemini error from being hammered immediately, without needing
// any external scheduling.
const BACKOFF_SECONDS = [10, 60, 300];
function backoffMs(attempts: number) {
  const seconds = BACKOFF_SECONDS[attempts - 1] ?? BACKOFF_SECONDS[BACKOFF_SECONDS.length - 1];
  return seconds * 1000;
}

/**
 * Creates a campaign's Concepts/CopyVariants (fast, local, no external
 * calls) and one PENDING Creative job per concept x format — no image
 * generation happens here. Dispatches JOB_CONCURRENCY worker chains and
 * returns as soon as the rows are written; the caller (the API route)
 * responds immediately after this resolves.
 */
export async function createCampaignJobs(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: { product: { include: { brand: true, images: true } } },
  });

  const { product } = campaign;
  const brief = buildProductBrief(product, product.brand);
  const analysis = analyzeProduct(brief, campaign.objective as ObjectiveId);
  const conceptPlans = buildConcepts(brief, analysis);
  const productImage = product.images.find((image) => image.role === "PRODUCT");

  for (const plan of conceptPlans) {
    const copy = generateCopy(plan, brief, analysis, campaign.objective as ObjectiveId);

    await prisma.concept.create({
      data: {
        campaignId: campaign.id,
        type: plan.type,
        label: plan.label,
        rationale: plan.rationale,
        highlightedFeature: plan.highlightedFeature,
        copy: {
          create: {
            headline: copy.headline,
            primaryText: copy.primaryText,
            description: copy.description,
            cta: copy.cta,
            shortCopy: copy.shortCopy,
            longCopy: copy.longCopy,
            missingInfo: copy.missingInfo.length
              ? JSON.stringify(copy.missingInfo)
              : null,
          },
        },
        creatives: {
          // status defaults to PENDING — nothing is generated here.
          create: FORMATS.map((format) => ({
            format: format.id,
            sourceImageId: productImage?.id,
          })),
        },
      },
    });
  }

  dispatchWorkers(campaign.id, currentJobConcurrency());
}

/**
 * Processes exactly one already-claimed job (status PROCESSING, see
 * lib/services/job-queue.ts#claimNextJob). On success the Creative becomes
 * COMPLETED with its imageUrl. On failure it goes back to PENDING with a
 * backoff delay if attempts remain, or FAILED (terminal) once exhausted.
 * Always finalizes the parent campaign's status if this was its last
 * non-terminal job. Called by the worker route and the cron sweep.
 */
export async function processClaimedJob(creativeId: string): Promise<void> {
  const creative = await prisma.creative.findUniqueOrThrow({
    where: { id: creativeId },
    include: {
      concept: {
        include: {
          copy: true,
          campaign: { include: { product: { include: { brand: true, images: true } } } },
        },
      },
    },
  });

  const { concept } = creative;
  const { campaign } = concept;
  const { product } = campaign;

  try {
    if (!concept.copy) {
      throw new Error("El concepto no tiene copy asociado.");
    }

    const brief = buildProductBrief(product, product.brand);
    const productImage = product.images.find((image) => image.role === "PRODUCT");
    const productImageBuffer = productImage
      ? await storage.read(keyFromUrl(productImage.url))
      : null;
    const logoImage = product.images.find((image) => image.role === "LOGO");
    const logoBuffer = logoImage
      ? await storage.read(keyFromUrl(logoImage.url))
      : product.brand?.logoUrl
        ? await storage.read(keyFromUrl(product.brand.logoUrl)).catch(() => null)
        : null;

    // version 1 (first generation) -> variantSeed 0; each regeneration
    // bumps both version and variantSeed together, so the layout reliably
    // alternates on every "Regenerar" click, not just every other one.
    const rendered = await imageGeneration.generateCreative({
      formatId: creative.format,
      styleId: campaign.style,
      conceptType: concept.type,
      headline: concept.copy.headline,
      supportingLine: concept.copy.description,
      priceDisplay: brief.priceDisplay,
      ctaLabel: concept.copy.cta,
      productImageBuffer,
      logoBuffer,
      variantSeed: creative.version - 1,
    });

    const saved = await storage.save({
      buffer: rendered.buffer,
      folder: `creatives/${campaign.id}`,
      extension: "png",
    });

    await prisma.creative.update({
      where: { id: creative.id },
      data: {
        status: "COMPLETED",
        imageUrl: saved.url,
        provider: activeImageProviderName(),
        completedAt: new Date(),
        error: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const exhausted = creative.attempts >= creative.maxAttempts;

    await prisma.creative.update({
      where: { id: creative.id },
      data: exhausted
        ? { status: "FAILED", error: message }
        : {
            status: "PENDING",
            error: message,
            nextAttemptAt: new Date(Date.now() + backoffMs(creative.attempts)),
          },
    });
  }

  await finalizeCampaignIfDone(campaign.id);
}

/**
 * "Last one out closes the door": once a campaign has no PENDING/PROCESSING
 * jobs left, sets its final status — READY if at least one creative
 * completed, FAILED otherwise. Safe to call redundantly (e.g. also from the
 * sweep) — it's a no-op whenever open work remains.
 */
export async function finalizeCampaignIfDone(campaignId: string): Promise<void> {
  const openCount = await prisma.creative.count({
    where: {
      status: { in: ["PENDING", "PROCESSING"] },
      concept: { campaignId },
    },
  });
  if (openCount > 0) return;

  const completedCount = await prisma.creative.count({
    where: { status: "COMPLETED", concept: { campaignId } },
  });

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: completedCount > 0 ? "READY" : "FAILED" },
  });
}

/**
 * Creates a new PENDING Creative (next version) for the same concept +
 * format and dispatches a worker to pick it up. Returns immediately with
 * the PENDING row — the caller polls for completion like any other job.
 */
export async function regenerateCreative(creativeId: string): Promise<Creative> {
  const creative = await prisma.creative.findUniqueOrThrow({
    where: { id: creativeId },
    include: { concept: { include: { campaign: true } } },
  });

  const newCreative = await prisma.creative.create({
    data: {
      conceptId: creative.conceptId,
      sourceImageId: creative.sourceImageId,
      format: creative.format,
      version: creative.version + 1,
      status: "PENDING",
    },
  });

  // Reopen the campaign — it may have already been READY/FAILED, but there
  // is new open work now. finalizeCampaignIfDone will close it again.
  await prisma.campaign.update({
    where: { id: creative.concept.campaign.id },
    data: { status: "PENDING" },
  });

  dispatchWorkers(creative.concept.campaign.id, 1);

  return newCreative;
}
