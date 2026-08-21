import { FORMATS } from "@/lib/catalog/formats";
import type { ObjectiveId } from "@/lib/catalog/objectives";
import { prisma } from "@/lib/db";
import { buildProductBrief } from "@/lib/product-brief";
import { analyzeProduct } from "@/lib/services/analysis-engine";
import { buildConcepts } from "@/lib/services/concept-engine";
import { generateCopy } from "@/lib/services/copy-service";
import { imageGeneration } from "@/lib/services/image-generation";
import { storage } from "@/lib/services/storage";

function keyFromUrl(url: string) {
  return url.replace(/^\/api\/files\//, "");
}

/**
 * Runs the full PRODUCTO → ANÁLISIS → CONCEPTOS → COPY → CREATIVIDADES
 * pipeline for one campaign (a product + objective + style combination).
 * Synchronous end-to-end: local compositing is fast enough that the MVP
 * doesn't need a job queue yet (AGENTS.md #13 — ship the full flow first).
 */
export async function runCampaign(campaignId: string) {
  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: campaignId },
    include: {
      product: { include: { brand: true, images: true } },
    },
  });

  const { product } = campaign;
  const brief = buildProductBrief(product, product.brand);
  const analysis = analyzeProduct(brief, campaign.objective as ObjectiveId);
  const conceptPlans = buildConcepts(brief, analysis);

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

  let anyCreativeReady = false;

  for (const plan of conceptPlans) {
    const copy = generateCopy(plan, brief, analysis, campaign.objective as ObjectiveId);

    const concept = await prisma.concept.create({
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
      },
    });

    for (const format of FORMATS) {
      try {
        const rendered = await imageGeneration.generateCreative({
          formatId: format.id,
          styleId: campaign.style,
          conceptType: plan.type,
          headline: copy.headline,
          supportingLine: copy.description,
          priceDisplay: brief.priceDisplay,
          ctaLabel: copy.cta,
          productImageBuffer,
          logoBuffer,
          variantSeed: 0,
        });
        const saved = await storage.save({
          buffer: rendered.buffer,
          folder: `creatives/${campaign.id}`,
          extension: "png",
        });

        await prisma.creative.create({
          data: {
            conceptId: concept.id,
            sourceImageId: productImage?.id,
            format: format.id,
            imageUrl: saved.url,
            status: "READY",
          },
        });
        anyCreativeReady = true;
      } catch (error) {
        await prisma.creative.create({
          data: {
            conceptId: concept.id,
            sourceImageId: productImage?.id,
            format: format.id,
            status: "FAILED",
            error: error instanceof Error ? error.message : "Error desconocido",
          },
        });
      }
    }
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: anyCreativeReady ? "READY" : "FAILED" },
  });

  return campaign.id;
}

/**
 * Regenerates a single creative with a bumped variant seed so the layout
 * visibly changes, and a bumped version so history isn't lost.
 */
export async function regenerateCreative(creativeId: string) {
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
  const brief = buildProductBrief(product, product.brand);

  if (!concept.copy) {
    throw new Error("El concepto no tiene copy asociado.");
  }

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

  const rendered = await imageGeneration.generateVariation({
    formatId: creative.format,
    styleId: campaign.style,
    conceptType: concept.type,
    headline: concept.copy.headline,
    supportingLine: concept.copy.description,
    priceDisplay: brief.priceDisplay,
    ctaLabel: concept.copy.cta,
    productImageBuffer,
    logoBuffer,
    variantSeed: creative.version,
  });

  const saved = await storage.save({
    buffer: rendered.buffer,
    folder: `creatives/${campaign.id}`,
    extension: "png",
  });

  return prisma.creative.create({
    data: {
      conceptId: concept.id,
      sourceImageId: productImage?.id,
      format: creative.format,
      version: creative.version + 1,
      imageUrl: saved.url,
      status: "READY",
    },
  });
}
