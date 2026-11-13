import type { ReactNode } from "react";

export function Eyebrow({ index, children, dark = false }: { index: string; children: ReactNode; dark?: boolean }) {
  return (
    <p className={`flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-white/70" : "text-steel"}`}>
      <span className="tabular-nums">{index}</span>
      <span aria-hidden className={`h-px w-10 ${dark ? "bg-white/40" : "bg-steel/50"}`} />
      <span>{children}</span>
    </p>
  );
}
