import type { Prisma } from "@/generated/prisma/client";

export type CampaignWithResults = Prisma.CampaignGetPayload<{
  include: {
    product: { include: { images: true; brand: true } };
    concepts: {
      include: { copy: true; creatives: true };
    };
  };
}>;

export type ConceptWithResults = CampaignWithResults["concepts"][number];
export type CreativeResult = ConceptWithResults["creatives"][number];
