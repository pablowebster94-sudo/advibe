export function SelectableCard({
  label,
  description,
  selected,
  onClick,
  swatch,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onClick: () => void;
  swatch?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex flex-col gap-1.5 rounded-[var(--radius-md)] border p-4 text-left transition-colors cursor-pointer ${
        selected
          ? "border-accent-strong bg-accent-soft/40 ring-1 ring-accent-strong"
          : "border-border bg-surface hover:border-accent-strong/50"
      }`}
    >
      <div className="flex items-center gap-2">
        {swatch && (
          <span
            className="h-3.5 w-3.5 rounded-full border border-border/60"
            style={{ background: swatch }}
          />
        )}
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      {description && <span className="text-xs text-muted">{description}</span>}
    </button>
  );
}
