import { storage } from "@/lib/services/storage";

/**
 * Every row that went through StorageService stores a `key`, not a URL
 * (see ARCHITECTURE.md → "Storage") — these resolve it to a URL at read
 * time, right before a Server Component render or an API JSON response.
 * Async because a real S3-compatible provider signs a time-limited URL on
 * every call — nothing upstream of these two functions needs to know that.
 */
export async function withResolvedImageUrl<T extends { key: string }>(
  image: T
): Promise<Omit<T, "key"> & { url: string }> {
  const { key, ...rest } = image;
  return { ...rest, url: await storage.urlFor(key) };
}

export async function withResolvedCreativeUrl<T extends { imageKey: string | null }>(
  creative: T
): Promise<Omit<T, "imageKey"> & { imageUrl: string | null }> {
  const { imageKey, ...rest } = creative;
  return { ...rest, imageUrl: imageKey ? await storage.urlFor(imageKey) : null };
}

/**
 * Resolves every creative's imageKey across a list of concepts (each with
 * its own creatives array). Kept deliberately un-generic over the "campaign"
 * shape itself — TypeScript's inference for a doubly-nested generic
 * (concepts-of-creatives) resolves the array element type down to its
 * narrowest constraint instead of the actual wider shape, which silently
 * drops fields from the return type. Callers spread the result back onto
 * their own campaign object instead.
 */
export async function withResolvedConcepts<
  Concept extends { creatives: { imageKey: string | null }[] },
>(
  concepts: Concept[]
): Promise<
  (Omit<Concept, "creatives"> & {
    creatives: (Omit<Concept["creatives"][number], "imageKey"> & {
      imageUrl: string | null;
    })[];
  })[]
> {
  return Promise.all(
    concepts.map(async (concept) => {
      const creatives = await Promise.all(concept.creatives.map(withResolvedCreativeUrl));
      return { ...concept, creatives };
    })
  );
}
