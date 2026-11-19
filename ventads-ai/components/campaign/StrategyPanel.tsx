import type { StrategyRecommendation, StrategyOption } from "@/lib/services/strategy-service";

/**
 * The live read-out of what the brief currently implies: what would be built,
 * whether the budget supports it, and exactly what is still missing.
 *
 * Deliberately not a score or a grade. Every claim shown here is traceable to
 * a field the operator typed, and every option states what it costs to choose
 * it, so the decision stays theirs.
 */

const BUDGET_TONE: Record<StrategyRecommendation["budget"]["verdict"], string> = {
  SIN_PRESUPUESTO: "border-border bg-surface-muted text-muted",
  POR_DEBAJO_DEL_MINIMO: "border-danger/40 bg-danger/10 text-foreground",
  AJUSTADO: "border-border bg-surface text-foreground",
  SUFICIENTE: "border-accent-strong/30 bg-accent-soft/40 text-foreground",
};

const BUDGET_LABEL: Record<StrategyRecommendation["budget"]["verdict"], string> = {
  SIN_PRESUPUESTO: "Sin presupuesto",
  POR_DEBAJO_DEL_MINIMO: "Por debajo del mínimo",
  AJUSTADO: "Ajustado",
  SUFICIENTE: "Suficiente",
};

function Plan({ option, primary }: { option: StrategyOption; primary?: boolean }) {
  return (
    <div
      className={`rounded-[var(--radius-md)] border p-4 ${
        primary ? "border-accent-strong/40 bg-surface" : "border-border bg-surface-muted"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">{option.label}</p>
        {primary && (
          <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-strong">
            Recomendado
          </span>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[var(--radius-sm)] bg-surface px-2 py-2">
          <dt className="text-[11px] text-muted">Conjuntos</dt>
          <dd className="text-base font-bold text-foreground">{option.structure.adSets}</dd>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-surface px-2 py-2">
          <dt className="text-[11px] text-muted">Anuncios</dt>
          <dd className="text-base font-bold text-foreground">{option.structure.totalAds}</dd>
        </div>
        <div className="rounded-[var(--radius-sm)] bg-surface px-2 py-2">
          <dt className="text-[11px] text-muted">Objetivo Meta</dt>
          <dd className="truncate text-[11px] font-semibold text-foreground" title={option.metaObjective}>
            {option.metaObjective.replace("OUTCOME_", "")}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-muted">
        <span className="font-semibold text-foreground">Por qué. </span>
        {option.rationale}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">
        <span className="font-semibold text-foreground">A cambio. </span>
        {option.tradeoff}
      </p>
      <p className="mt-3 text-[11px] text-faint">
        Público: {option.audience.geo}
        {option.audience.language ? ` · ${option.audience.language}` : ""}
      </p>
    </div>
  );
}

export function StrategyPanel({ strategy }: { strategy: StrategyRecommendation }) {
  const blocking = strategy.missingInfo.filter((m) => m.blocking);
  const optional = strategy.missingInfo.filter((m) => !m.blocking);
  const { budget } = strategy;

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`rounded-[var(--radius-md)] border px-4 py-3 ${
          strategy.readyToPublish
            ? "border-accent-strong/40 bg-accent-soft/40"
            : "border-danger/40 bg-danger/10"
        }`}
      >
        <p className="text-sm font-bold text-foreground">
          {strategy.readyToPublish
            ? "Listo para generar y aprobar"
            : `Faltan ${blocking.length} dato(s) para poder publicar`}
        </p>
        {!strategy.readyToPublish && (
          <p className="mt-0.5 text-xs text-muted">
            Nada se envía a Meta mientras falte algo de esta lista.
          </p>
        )}
      </div>

      <Plan option={strategy.recommended} primary />

      <div className={`rounded-[var(--radius-md)] border px-4 py-3 ${BUDGET_TONE[budget.verdict]}`}>
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-semibold">Presupuesto · {BUDGET_LABEL[budget.verdict]}</p>
          {budget.dailyUsd != null && (
            <p className="text-sm font-bold">${budget.dailyUsd}/día</p>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed">{budget.message}</p>
        {budget.totalUsd != null && (
          <p className="mt-1 text-[11px] opacity-70">
            Total estimado: ${budget.totalUsd}
            {budget.durationDays ? ` en ${budget.durationDays} días` : ""}
          </p>
        )}
      </div>

      {blocking.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-danger">
            Impide publicar
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {blocking.map((m) => (
              <li key={m.field} className="rounded-[var(--radius-sm)] border border-danger/30 bg-surface px-3 py-2">
                <p className="text-sm font-semibold text-foreground">{m.label}</p>
                <p className="text-xs text-muted">{m.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {optional.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
            Mejoraría los anuncios
          </h3>
          <ul className="mt-2 flex flex-col gap-2">
            {optional.map((m) => (
              <li key={m.field} className="rounded-[var(--radius-sm)] border border-border bg-surface px-3 py-2">
                <p className="text-sm font-semibold text-foreground">{m.label}</p>
                <p className="text-xs text-muted">{m.why}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {strategy.alternatives.length > 0 && (
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-muted">
            Otras formas de hacerlo
          </h3>
          <div className="mt-2 flex flex-col gap-3">
            {strategy.alternatives.map((a) => (
              <Plan key={a.id} option={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
