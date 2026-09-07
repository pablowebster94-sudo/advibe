"use client";

/**
 * One numbered stage of the colour lab.
 *
 * The flow is linear because the dependencies are real: you cannot analyse
 * material you have not loaded, and a look chosen before the analysis is a
 * look chosen against the wrong image. Rather than hiding the later stages,
 * they stay visible and locked, with the reason stated — a form that shows you
 * what is coming and why you cannot get there yet is easier to work than one
 * that reveals itself a panel at a time.
 */
import type { ReactNode } from "react";

export type StepState = "locked" | "ready" | "active" | "done";

const MARKERS: Record<StepState, { ring: string; fill: string; text: string }> = {
  locked: { ring: "border-neutral-800", fill: "bg-neutral-900", text: "text-neutral-600" },
  ready: { ring: "border-neutral-700", fill: "bg-neutral-900", text: "text-neutral-300" },
  active: { ring: "border-[#78d94f]", fill: "bg-[#78d94f]/15", text: "text-[#a4ef84]" },
  done: { ring: "border-[#78d94f]", fill: "bg-[#78d94f]", text: "text-[#06120a]" },
};

export function Step({
  index,
  title,
  state,
  summary,
  lockedReason,
  action,
  children,
}: {
  index: number;
  title: string;
  state: StepState;
  /** One line of what this step has settled, shown once it is done. */
  summary?: ReactNode;
  /** Why the step cannot be used yet. Shown only when locked. */
  lockedReason?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const marker = MARKERS[state];
  const locked = state === "locked";

  return (
    <section
      className={`rounded-xl border bg-neutral-900/70 transition-colors ${
        state === "active" ? "border-[#78d94f]/40" : "border-neutral-800"
      }`}
      aria-current={state === "active" ? "step" : undefined}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-neutral-800 px-4 py-3">
        <span
          aria-hidden
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums ${marker.ring} ${marker.fill} ${marker.text}`}
        >
          {state === "done" ? "✓" : index}
        </span>
        <h2
          className={`text-sm font-semibold tracking-wide ${
            locked ? "text-neutral-600" : "text-neutral-200"
          }`}
        >
          {title}
        </h2>
        {summary && state === "done" && (
          <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">{summary}</span>
        )}
        {action && <span className="ml-auto">{action}</span>}
      </header>
      <div className={`p-4 ${locked ? "pointer-events-none opacity-40 select-none" : ""}`}>
        {locked && lockedReason && (
          <p className="mb-3 text-sm text-neutral-500">{lockedReason}</p>
        )}
        {children}
      </div>
    </section>
  );
}
