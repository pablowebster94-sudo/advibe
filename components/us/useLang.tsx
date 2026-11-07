"use client";

import { useSyncExternalStore } from "react";
import type { Lang } from "@/lib/us-content";

// Idioma de la sección /us: lo último que eligió el visitante, o ?lang=es en la URL.
const KEY = "advibe-us-lang";
const listeners = new Set<() => void>();
let chosen: Lang | null = null;

function read(): Lang {
  if (chosen) return chosen;
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (fromUrl === "es" || fromUrl === "en") return fromUrl;
  try { return window.localStorage.getItem(KEY) === "es" ? "es" : "en"; } catch { return "en"; }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function setLang(l: Lang) {
  chosen = l;
  try { window.localStorage.setItem(KEY, l); } catch {}
  listeners.forEach((cb) => cb());
}

export function useLang(): [Lang, (l: Lang) => void] {
  const lang = useSyncExternalStore(subscribe, read, () => "en" as Lang);
  return [lang, setLang];
}

export function LangToggle({ lang, onChange, dark = true }: { lang: Lang; onChange: (l: Lang) => void; dark?: boolean }) {
  const base = dark ? "border-white/20 text-white/70" : "border-black/15 text-black/60";
  return (
    <div className={`inline-flex overflow-hidden rounded-full border text-xs font-semibold ${base}`} role="group" aria-label="Language">
      {(["en", "es"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={`px-3 py-1.5 transition ${lang === l ? (dark ? "bg-lime-400 text-black" : "bg-black text-white") : ""}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
