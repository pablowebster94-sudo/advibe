import type { CampaignProgress } from "@/lib/results-helpers";

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

export function ProgressBanner({
  progress,
  settled,
}: {
  progress: CampaignProgress;
  settled: boolean;
}) {
  if (progress.total === 0) return null;

  const parts: string[] = [];
  if (progress.completed > 0) {
    parts.push(`${progress.completed} ${pluralize(progress.completed, "lista", "listas")}`);
  }
  if (progress.failed > 0) {
    parts.push(`${progress.failed} ${pluralize(progress.failed, "falló", "fallaron")}`);
  }
  if (progress.inProgress > 0) {
    parts.push(`${progress.inProgress} en proceso`);
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm ${
        settled
          ? progress.failed > 0
            ? "border-danger/30 bg-danger/5 text-danger"
            : "border-border bg-surface-muted text-muted"
          : "border-accent-strong/30 bg-accent-soft/30 text-accent-strong"
      }`}
    >
      {!settled && (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-accent-strong border-t-transparent"
          aria-hidden
        />
      )}
      {/* Deliberately never "X de Y" — failures need their own count, not
          folded into an ambiguous "still pending" remainder. */}
      <span>{parts.join(", ")}</span>
    </div>
  );
}
