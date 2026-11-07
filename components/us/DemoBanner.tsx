"use client";

import Link from "next/link";
import type { Lang } from "@/lib/us-content";
import { LangToggle } from "@/components/us/useLang";

// Franja fija que deja claro que es un proyecto de muestra de AdVibe.
export default function DemoBanner({ lang, onLang }: { lang: Lang; onLang: (l: Lang) => void }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-lime-400 px-4 py-2 text-xs font-semibold text-black">
      <span className="min-w-0 text-[11px] leading-4 sm:text-xs">
        {lang === "en" ? "DEMO · Sample website by AdVibe. Fictional business." : "DEMO · Web de muestra hecha por AdVibe. Negocio ficticio."}{" "}
        <Link href={`/us?lang=${lang}#contact`} className="underline">{lang === "en" ? "Want one like this?" : "¿Quieres una así?"}</Link>
      </span>
      <div className="shrink-0"><LangToggle lang={lang} onChange={onLang} dark={false} /></div>
    </div>
  );
}
