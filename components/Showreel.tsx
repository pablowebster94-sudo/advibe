"use client";

import { useEffect, useRef, useState } from "react";
import type { Reel } from "@/lib/reels";

function ReelCard({ reel }: { reel: Reel }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggleSound = () => {
    const video = ref.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (!video.muted) video.play().catch(() => {});
  };

  return (
    <figure className="relative w-[68vw] max-w-[260px] shrink-0 snap-center sm:w-[240px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-[1.6rem] border border-white/10 bg-black">
        <video
          ref={ref}
          src={`/videos/${reel.id}.mp4`}
          poster={`/videos/${reel.id}.jpg`}
          muted
          loop
          playsInline
          preload="none"
          aria-label={`${reel.type} para ${reel.client}, producido por AdVibe Agencia`}
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? `Activar sonido de ${reel.client}` : `Silenciar ${reel.client}`}
          className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur"
        >
          {muted ? "🔇 Sonido" : "🔊"}
        </button>
      </div>
      <figcaption className="mt-3 px-1">
        <p className="text-sm font-semibold text-white">{reel.client}</p>
        <p className="text-xs text-slate-500">{reel.type}</p>
      </figcaption>
    </figure>
  );
}

type ShowreelProps = {
  reels: Reel[];
  eyebrow?: string;
  title?: string;
  id?: string;
};

export default function Showreel({
  reels,
  eyebrow = "Nuestro trabajo",
  title = "Así se ve el contenido que hacemos para negocios del Azuay.",
  id = "trabajo",
}: ShowreelProps) {
  return (
    <section id={id} className="relative bg-[#05070a] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">{eyebrow}</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">{title}</h2>
        {reels.length > 4 ? <p className="mt-4 text-sm text-slate-500">Desliza para ver más →</p> : null}
        <div className="-mx-6 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 sm:gap-6">
          {reels.map((reel) => (
            <ReelCard key={reel.id} reel={reel} />
          ))}
        </div>
      </div>
    </section>
  );
}
