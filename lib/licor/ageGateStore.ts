"use client";

import { createBrowserStore } from "./browserStore";

/**
 * 21+ gate state.
 *
 * A confirmation persists in localStorage. A denial is kept only for the
 * current session and, once set, there is deliberately no path back to the
 * store from the blocked screen.
 */
export type AgeGateState = "checking" | "asking" | "allowed" | "denied";

const VERIFIED_KEY = "licor-store-24:age-verified:v1";
const DENIED_KEY = "licor-store-24:age-denied";

const deniedStore = createBrowserStore<boolean>({
  key: DENIED_KEY,
  storage: "session",
  serverSnapshot: false,
  parse: (raw) => raw === "1",
  serialize: (value) => (value ? "1" : "0"),
});

const verifiedStore = createBrowserStore<AgeGateState>({
  key: VERIFIED_KEY,
  serverSnapshot: "checking",
  parse: (raw) => (raw === "1" ? "allowed" : "asking"),
  serialize: (state) => (state === "allowed" ? "1" : "0"),
});

export const ageGate = {
  subscribe(listener: () => void) {
    const unsubscribeDenied = deniedStore.subscribe(listener);
    const unsubscribeVerified = verifiedStore.subscribe(listener);
    return () => {
      unsubscribeDenied();
      unsubscribeVerified();
    };
  },
  getSnapshot(): AgeGateState {
    if (deniedStore.getSnapshot()) return "denied";
    return verifiedStore.getSnapshot();
  },
  getServerSnapshot(): AgeGateState {
    return "checking";
  },
  confirm() {
    verifiedStore.set("allowed");
  },
  deny() {
    deniedStore.set(true);
  },
};
