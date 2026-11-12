import { NextResponse } from "next/server";
import { z } from "zod";
import { STYLES } from "@/lib/catalog/styles";
import { FORMATS } from "@/lib/catalog/formats";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { interpretCreativePrompt, inferCreativeStyle } from "@/lib/services/creative-director";
import { jsonRoute } from "@/lib/api-route";

export const runtime = "nodejs";
export const maxDuration = 60;

const imageSchema = z.object({
  key: z.string().min(1).max(500),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const inputSchema = z.object({
  prompt: z.string().trim().min(8, "Cuéntame un poco más sobre la publicidad que necesitas.").max(5000),
  productImage: imageSchema.optional(),
  logoImage: imageSchema.optional(),
  brandId: z.string().min(1).optional(),
  brandName: z.string().trim().max(120).optional(),
  contactPhone: z.string().trim().max(40).optional(),
  footerNote: z.string().trim().max(120).optional(),
  colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).length(2).optional(),
  style: z.union([z.literal("AUTO"), z.string().refine((value) => STYLES.some((style) => style.id === value))]).default("AUTO"),
  formats: z.array(z.string().refine((value) => FORMATS.some((format) => format.id === value))).min(1).max(3).default(FORMATS.map((format) => format.id)),
});

async function handlePOST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }

  const input = parsed.data;
  if (input.productImage && !input.productImage.key.startsWith("products/")) {
    return NextResponse.json({ error: "La fotografía del producto no tiene una referencia de carga válida." }, { status: 400 });
  }
  if (input.logoImage && !input.logoImage.key.startsWith("logos/")) {
    return NextResponse.json({ error: "El logotipo no tiene una referencia de carga válida." }, { status: 400 });
  }
  let brandId = input.brandId;
  if (brandId) {
    const existing = await prisma.brand.findFirst({ where: { id: brandId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "La marca seleccionada no existe." }, { status: 404 });
    await prisma.brand.update({
      where: { id: existing.id },
      data: {
        ...(input.logoImage ? { logoKey: input.logoImage.key } : {}),
        ...(input.brandName ? { name: input.brandName } : {}),
        ...(input.contactPhone ? { contactPhone: input.contactPhone } : {}),
        ...(input.footerNote ? { footerNote: input.footerNote } : {}),
        ...(input.colors ? { colors: JSON.stringify(input.colors) } : {}),
      },
    });
  } else if (input.brandName || input.contactPhone || input.logoImage) {
    const brand = await prisma.brand.create({
      data: {
        userId: user.id,
        name: input.brandName || "Mi marca",
        contactPhone: input.contactPhone || null,
        footerNote: input.footerNote || null,
        logoKey: input.logoImage?.key || null,
        colors: input.colors ? JSON.stringify(input.colors) : null,
        defaultCta: input.contactPhone ? "Escríbenos por WhatsApp" : "Solicita información",
      },
    });
    brandId = brand.id;
  }

  const brief = await interpretCreativePrompt(input.prompt);
  const description = [brief.description, `Brief creativo original: ${input.prompt}`]
    .filter(Boolean).join("\n\n").slice(0, 2000);

  const product = await prisma.product.create({
    data: {
      userId: user.id,
      brandId: brandId || null,
      category: brief.category,
      name: brief.name,
      manufacturer: brief.manufacturer ?? null,
      model: brief.model ?? null,
      price: brief.price ?? null,
      currency: "USD",
      priceLabel: brief.priceLabel ?? null,
      description,
      features: brief.features.join("\n") || null,
      benefits: brief.benefits.join("\n") || null,
      offer: brief.offer ?? null,
      cta: brief.cta ?? (input.contactPhone ? "Escríbenos por WhatsApp" : "Solicita información"),
      targetAudience: brief.targetAudience ?? null,
      adTitle: brief.adTitle ?? null,
      includes: brief.includes.join("\n") || null,
      images: {
        create: [
          ...(input.productImage ? [{ key: input.productImage.key, role: "PRODUCT" as const, width: input.productImage.width, height: input.productImage.height, sortOrder: 0 }] : []),
          ...(input.logoImage ? [{ key: input.logoImage.key, role: "LOGO" as const, width: input.logoImage.width, height: input.logoImage.height, sortOrder: 1 }] : []),
        ],
      },
    },
  });

  const style = input.style === "AUTO" ? inferCreativeStyle(input.prompt) : input.style;
  const campaign = await prisma.campaign.create({
    data: { productId: product.id, objective: "VENDER", style, templateId: null },
  });

  try {
    const { createCampaignJobs } = await import("@/lib/services/campaign-service");
    await createCampaignJobs(campaign.id, { variants: 3, formats: input.formats });
  } catch (error) {
    console.error("Creative studio setup failed", error);
    await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "No se pudo preparar la creatividad. El producto quedó guardado para que puedas intentarlo nuevamente." }, { status: 500 });
  }

  return NextResponse.json({
    campaign: { id: campaign.id },
    product: { id: product.id, name: product.name },
    style,
    formats: input.formats,
  }, { status: 201 });
}

export const POST = jsonRoute("POST /api/creative-studio", handlePOST);
