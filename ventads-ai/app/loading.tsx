export default function Loading() {
  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10" aria-busy="true">
      <span className="text-sm font-semibold tracking-tight text-foreground">
        ventADS<span className="text-accent-strong">.ai</span>
      </span>
      <div className="h-8 w-64 animate-pulse rounded-[var(--radius-sm)] bg-surface-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-48 animate-pulse rounded-[var(--radius-lg)] bg-surface-muted" />
        ))}
      </div>
      <p className="text-sm text-muted">Cargando…</p>
    </div>
  );
}
