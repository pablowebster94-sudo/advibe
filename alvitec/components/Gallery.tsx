"use client";

import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gallery } from "@/lib/images";
import { Reveal } from "./Motion";
import { Eyebrow } from "./SectionHeading";
import { ArrowLeft, ArrowRight, CloseIcon, PlusIcon } from "./icons";

export function Gallery() {
  const [active, setActive] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const open = active !== null;

  const close = useCallback(() => setActive(null), []);
  const move = useCallback((dir: number) => setActive((i) => (i === null ? i : (i + dir + gallery.length) % gallery.length)), []);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      trigger?.focus({ preventScroll: true });
    };
  }, [open, close, move]);

  const item = active !== null ? gallery[active] : null;

  return (
    <section id="galeria" className="bg-mist py-20 sm:py-28 lg:py-36">
      <div className="container-site">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <Eyebrow index="05">Galería referencial</Eyebrow>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-5xl lg:text-6xl">Ideas en aluminio y vidrio.</h2>
          </Reveal>
          <Reveal className="lg:col-span-4 lg:col-start-9" delay={0.1}>
            <p className="text-base leading-relaxed text-ink/80">
              Fotografías ilustrativas de aplicaciones arquitectónicas. No son trabajos realizados por ALVITEC: sirven como referencia para conversar sobre tu proyecto.
            </p>
          </Reveal>
        </div>

        <ul className="mt-14 columns-1 gap-3 sm:columns-2 lg:mt-20 lg:columns-3 lg:gap-4">
          {gallery.map((g, i) => (
            <li key={g.src.src} className="mb-3 break-inside-avoid lg:mb-4">
              <button
                type="button"
                onClick={(e) => {
                  triggerRef.current = e.currentTarget;
                  setActive(i);
                }}
                aria-label={`Ampliar imagen referencial: ${g.label}`}
                className="on-dark group relative block w-full overflow-hidden bg-navy text-left"
              >
                <Image
                  src={g.src}
                  alt={g.alt}
                  sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                  className="h-auto w-full transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy/85 via-transparent to-transparent" />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-white sm:p-5">
                  <span>
                    <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-white/80">Referencia</span>
                    <span className="mt-1 block font-display text-base font-semibold tracking-[-0.01em]">{g.label}</span>
                  </span>
                  <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/50 transition-colors group-hover:bg-white group-hover:text-navy">
                    <PlusIcon width={16} height={16} />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {item && active !== null && (
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={`Imagen referencial: ${item.label}`}
            className="on-dark fixed inset-0 z-[70] flex flex-col bg-navy/95 text-white backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-8" onClick={(e) => e.stopPropagation()}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 tabular-nums">
                {String(active + 1).padStart(2, "0")} / {String(gallery.length).padStart(2, "0")}
              </p>
              <button ref={closeRef} type="button" onClick={close} aria-label="Cerrar galería" className="flex h-11 w-11 items-center justify-center border border-white/40 hover:bg-white hover:text-navy">
                <CloseIcon width={20} height={20} />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 px-4 sm:px-20">
              <m.div key={active} className="relative h-full w-full" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                <Image src={item.src} alt={item.alt} fill sizes="100vw" className="object-contain" onClick={(e) => e.stopPropagation()} />
              </m.div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); move(-1); }}
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/40 bg-navy/60 hover:bg-white hover:text-navy sm:left-6"
              >
                <ArrowLeft width={20} height={20} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); move(1); }}
                aria-label="Imagen siguiente"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center border border-white/40 bg-navy/60 hover:bg-white hover:text-navy sm:right-6"
              >
                <ArrowRight width={20} height={20} />
              </button>
            </div>

            <div className="px-4 py-4 text-center sm:px-8" onClick={(e) => e.stopPropagation()}>
              <p className="font-display text-lg font-semibold">{item.label}</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white/75">Imagen referencial · No es un trabajo de ALVITEC</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
