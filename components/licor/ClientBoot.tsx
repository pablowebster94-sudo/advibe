"use client";

import { useEffect } from "react";
import { route } from "@/lib/licor/config";

/**
 * Client-side bootstrapping for the storefront:
 *  - registers the PWA service worker (production only)
 *  - sets `lang`/`dir` on <html>, which the shared root layout owns
 */
export default function ClientBoot() {
  useEffect(() => {
    const root = document.documentElement;
    const previousLang = root.lang;
    root.lang = "en";
    return () => {
      root.lang = previousLang;
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const controller = new AbortController();
    navigator.serviceWorker
      .register(route("/sw.js"), { scope: `${route("/")}/` })
      .catch(() => {
        // Offline support is a progressive enhancement; ignore failures.
      });
    return () => controller.abort();
  }, []);

  return null;
}
