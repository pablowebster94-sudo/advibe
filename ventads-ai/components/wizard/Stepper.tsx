export const WIZARD_STEPS = [
  "Producto",
  "Fotos",
  "Marca",
  "Objetivo",
  "Estilo",
  "Generar",
] as const;

export function Stepper({
  current,
  furthestUnlocked,
  onSelect,
}: {
  current: number;
  furthestUnlocked: number;
  onSelect: (index: number) => void;
}) {
  return (
    <ol className="flex w-full items-center gap-1 overflow-x-auto pb-1">
      {WIZARD_STEPS.map((label, index) => {
        const isActive = index === current;
        const isDone = index < current;
        const isUnlocked = index <= furthestUnlocked;
        return (
          <li key={label} className="flex flex-1 items-center gap-1 min-w-fit">
            <button
              type="button"
              disabled={!isUnlocked}
              onClick={() => onSelect(index)}
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer disabled:cursor-not-allowed ${
                isActive
                  ? "bg-accent-strong text-white"
                  : isDone
                    ? "bg-accent-soft text-accent-strong hover:bg-accent-soft/80"
                    : "bg-surface-muted text-faint"
              }`}
            >
              <span
                className={`flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px] ${
                  isActive
                    ? "bg-white/20"
                    : isDone
                      ? "bg-accent-strong text-white"
                      : "bg-white/60"
                }`}
              >
                {isDone ? "✓" : index + 1}
              </span>
              {label}
            </button>
            {index < WIZARD_STEPS.length - 1 && (
              <span className="h-px flex-1 bg-border" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
