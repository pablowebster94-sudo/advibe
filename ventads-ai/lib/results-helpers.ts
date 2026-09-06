import type { ConceptWithResults, CreativeResult } from "@/lib/types/campaign";

/** The current (highest-version) creative per format for one concept. */
export function latestCreativesByFormat(creatives: CreativeResult[]): CreativeResult[] {
  const map = new Map<string, CreativeResult>();
  for (const creative of creatives) {
    const current = map.get(creative.format);
    if (!current || creative.version > current.version) {
      map.set(creative.format, creative);
    }
  }
  return [...map.values()];
}

export type CampaignProgress = {
  completed: number;
  failed: number;
  /** PENDING or PROCESSING — deliberately not split further for the UI. */
  inProgress: number;
  total: number;
};

/**
 * Aggregates progress across every concept's *current* creatives (one per
 * format, deduped by version — see latestCreativesByFormat). Used by both
 * the top-of-page progress banner and to decide whether polling can stop.
 */
export function computeCampaignProgress(concepts: ConceptWithResults[]): CampaignProgress {
  let completed = 0;
  let failed = 0;
  let inProgress = 0;

  for (const concept of concepts) {
    for (const creative of latestCreativesByFormat(concept.creatives)) {
      if (creative.status === "COMPLETED") completed++;
      else if (creative.status === "FAILED") failed++;
      else inProgress++; // PENDING | PROCESSING
    }
  }

  return { completed, failed, inProgress, total: completed + failed + inProgress };
}

export function isCampaignSettled(progress: CampaignProgress): boolean {
  return progress.inProgress === 0;
}
