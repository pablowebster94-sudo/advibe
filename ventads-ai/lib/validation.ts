import { z } from "zod";
import { OBJECTIVES } from "@/lib/catalog/objectives";
import { STYLES } from "@/lib/catalog/styles";
import { TEMPLATE_IDS } from "@/lib/templates/catalog";

export const promotionSchema = z.object({
  value: z.string().trim().min(1).max(12),
  label: z.string().trim().min(1).max(60),
  detail: z.string().trim().max(80).optional().nullable(),
  note: z.string().trim().max(80).optional().nullable(),
});

const imageInput = z.object({
  key: z.string().min(1),
  role: z.enum(["PRODUCT", "LOGO", "REFERENCE"]).default("PRODUCT"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const productInputSchema = z.object({
  category: z.string().min(1).max(60),
  name: z.string().min(1).max(120),
  manufacturer: z.string().max(80).optional(),
  model: z.string().max(80).optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).default("USD"),
  priceLabel: z.string().max(60).optional(),
  description: z.string().max(2000).optional(),
  features: z.string().max(2000).optional(),
  benefits: z.string().max(2000).optional(),
  offer: z.string().max(300).optional(),
  cta: z.string().max(60).optional(),
  targetAudience: z.string().max(300).optional(),
  adTitle: z.string().max(120).optional(),
  includes: z.string().max(1000).optional(),
  promotions: z.array(promotionSchema).max(6).optional(),
  brandId: z.string().optional(),
  images: z.array(imageInput).max(20).default([]),
});

export const brandInputSchema = z.object({
  name: z.string().min(1).max(120),
  logoKey: z.string().optional(),
  colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).max(6).optional(),
  fontFamily: z.string().max(60).optional(),
  contactPhone: z.string().max(40).optional(),
  contactEmail: z.string().email().max(120).optional().or(z.literal("")),
  website: z.string().max(200).optional(),
  defaultCta: z.string().max(60).optional(),
  footerNote: z.string().max(120).optional(),
  templateId: z.enum(TEMPLATE_IDS).optional(),
});

/** Brand Kit edits: every field optional; null clears it. */
export const brandUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  logoKey: z.string().nullable().optional(),
  colors: z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).max(6).nullable().optional(),
  contactPhone: z.string().max(40).nullable().optional(),
  defaultCta: z.string().max(60).nullable().optional(),
  footerNote: z.string().max(120).nullable().optional(),
  templateId: z.enum(TEMPLATE_IDS).nullable().optional(),
});

const objectiveIds = OBJECTIVES.map((objective) => objective.id) as [
  string,
  ...string[],
];
const styleIds = STYLES.map((style) => style.id) as [string, ...string[]];

export const campaignInputSchema = z.object({
  productId: z.string().min(1),
  objective: z.enum(objectiveIds),
  style: z.enum(styleIds),
  /** How many ad angles (each rendered in every format). */
  variants: z.number().int().min(3).max(4).optional(),
  /** Design template; omitted = classic renderer. */
  templateId: z.enum(TEMPLATE_IDS).optional(),
});
