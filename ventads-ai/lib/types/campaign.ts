import type { Prisma } from "@/generated/prisma/client";

type RawCampaign = Prisma.CampaignGetPayload<{
  include: {
    product: { include: { images: true; brand: true } };
    concepts: {
      include: { copy: true; creatives: true };
    };
  };
}>;

type RawCreative = RawCampaign["concepts"][number]["creatives"][number];

// `imageKey` (a storage key) is resolved to `imageUrl` before this ever
// reaches a client — see lib/serialize.ts#withResolvedCreativeUrl.
export type CreativeResult = Omit<RawCreative, "imageKey"> & {
  imageUrl: string | null;
};

export type ConceptWithResults = Omit<RawCampaign["concepts"][number], "creatives"> & {
  creatives: CreativeResult[];
};

export type CampaignWithResults = Omit<RawCampaign, "concepts"> & {
  concepts: ConceptWithResults[];
};
