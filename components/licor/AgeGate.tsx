"use client";

import { useEffect, useSyncExternalStore } from "react";
import { ageGate } from "@/lib/licor/ageGateStore";
import { BUSINESS } from "@/lib/licor/config";
import Logo from "./Logo";
import { ActionButton } from "./ui";

/**
 * 21+ age gate. Blocks the page until the visitor confirms they are of legal
 * drinking age; a "no" answer ends the session with no way through.
 */
export default function AgeGate() {
  const state = useSyncExternalStore(
    ageGate.subscribe,
    ageGate.getSnapshot,
    ageGate.getServerSnapshot,
  );

  const blocking = state === "asking" || state === "denied";

  // Lock body scroll while the gate covers the page.
  useEffect(() => {
    if (!blocking) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [blocking]);

  if (!blocking) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/95 px-5 py-10 backdrop-blur-md"
    >
      <div className="w-full max-w-md rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-b from-[#131315] to-[#08080A] p-7 text-center shadow-[0_40px_120px_-30px_rgba(224,27,34,0.4)] sm:p-9">
        <div className="flex justify-center">
          <Logo size="lg" asLink={false} />
        </div>

        {state === "asking" ? (
          <>
            <div className="mt-7 flex justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#E01B22] text-xl font-black text-[#E01B22]">
                21+
              </span>
            </div>
            <h1
              id="age-gate-title"
              className="mt-6 text-2xl font-black uppercase leading-tight tracking-tight text-white sm:text-[27px]"
            >
              Are you 21 or older?
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/60">
              You must be 21 or older to enter this website.
            </p>

            <div className="mt-8 grid gap-3">
              <ActionButton variant="primary" size="lg" onClick={ageGate.confirm} autoFocus>
                Yes, enter
              </ActionButton>
              <ActionButton variant="ghost" size="lg" onClick={ageGate.deny}>
                No, exit
              </ActionButton>
            </div>

            <p className="mt-7 text-[11px] leading-relaxed text-white/35">
              {BUSINESS.name} sells alcohol only to customers of legal drinking age.
              A valid government-issued ID is required at delivery. Please drink
              responsibly.
            </p>
          </>
        ) : (
          <>
            <h1
              id="age-gate-title"
              className="mt-8 text-2xl font-black uppercase leading-tight tracking-tight text-white"
            >
              Access restricted
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              You must be {BUSINESS.minimumAge} or older to browse or order from{" "}
              {BUSINESS.name}. This site is not available to you.
            </p>
            <p className="mt-8 text-[11px] uppercase tracking-[0.25em] text-white/30">
              Please close this window
            </p>
          </>
        )}
      </div>
    </div>
  );
}
