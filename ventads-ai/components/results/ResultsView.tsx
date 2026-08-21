"use client";

import { ConceptPanel } from "@/components/results/ConceptPanel";
import type { CampaignWithResults } from "@/lib/types/campaign";

export function ResultsView({ campaign }: { campaign: CampaignWithResults }) {
  if (campaign.concepts.length === 0) {
    return (
      <p className="text-sm text-muted">
        No se pudieron generar conceptos para este producto. Revisa que tenga
        suficiente información y vuelve a intentarlo.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {campaign.concepts.map((concept) => (
        <ConceptPanel key={concept.id} concept={concept} />
      ))}
    </div>
  );
}
