"use client";

import { useEffect, useState } from "react";
import { ConceptPanel } from "@/components/results/ConceptPanel";
import { ProgressBanner } from "@/components/results/ProgressBanner";
import { computeCampaignProgress, isCampaignSettled } from "@/lib/results-helpers";
import type { CampaignWithResults } from "@/lib/types/campaign";

const POLL_INTERVAL_MS = 2500;
// Safety cutoff so a genuinely stuck campaign doesn't poll forever in an
// abandoned tab — the cron sweep (or a fresh page load, which re-polls from
// zero) is the recovery path past this point.
const MAX_POLL_MS = 6 * 60 * 1000;

export function ResultsView({ campaign: initialCampaign }: { campaign: CampaignWithResults }) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [startedAt] = useState(() => Date.now());

  const progress = computeCampaignProgress(campaign.concepts);
  const settled = isCampaignSettled(progress);

  useEffect(() => {
    if (settled) return;
    if (Date.now() - startedAt > MAX_POLL_MS) return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/campaigns/${campaign.id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.campaign) setCampaign(data.campaign);
      } catch {
        // Transient network hiccup — the next tick retries.
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [campaign.id, settled, startedAt]);

  if (campaign.concepts.length === 0) {
    return (
      <p className="text-sm text-muted">
        No se pudieron generar conceptos para este producto. Revisa que tenga
        suficiente información y vuelve a intentarlo.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <ProgressBanner progress={progress} settled={settled} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {campaign.concepts.map((concept) => (
          <ConceptPanel key={concept.id} concept={concept} />
        ))}
      </div>
    </div>
  );
}
