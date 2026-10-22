"use client";

import { useEffect, useRef, useState } from "react";

const reels = [
  { src: "/videos/kamauto.mp4", poster: "/videos/kamauto.jpg", client: "Kamauto", type: "Sketch comercial" },
  { src: "/videos/am-mini-cooper.mp4", poster: "/videos/am-mini-cooper.jpg", client: "AM Motorsport", type: "Reel de vehículo" },
  { src: "/videos/restaurante.mp4", poster: "/videos/restaurante.jpg", client: "Restaurante", type: "Video gastronómico" },
  { src: "/videos/muebles.mp4", poster: "/videos/muebles.jpg", client: "Mueblería", type: "Video de producto" },
  { src: "/videos/rocys.mp4", poster: "/videos/rocys.jpg", client: "Rocy's Joyería", type: "Video de catálogo" },
  { src: "/videos/aa-school.mp4", poster: "/videos/aa-school.jpg", client: "AA School", type: "Campaña de inscripciones" },
  { src: "/videos/am-motorsport.mp4", poster: "/videos/am-motorsport.jpg", client: "AM Motorsport", type: "Reel de producto" },
  { src: "/videos/colchones.mp4", poster: "/videos/colchones.jpg", client: "Tienda de descanso", type: "Video de producto" },
  { src: "/videos/kamauto-entregas.mp4", poster: "/videos/kamauto-entregas.jpg", client: "Kamauto", type: "Entregas a clientes" },
  { src: "/videos/marca-personal.mp4", poster: "/videos/marca-personal.jpg", client: "Marca personal", type: "Video de presentación" },
  { src: "/videos/cetad.mp4", poster: "/videos/cetad.jpg", client: "CETAD San Lucas", type: "Video institucional" },
  { src: "/videos/basquet.mp4", poster: "/videos/basquet.jpg", client: "Club de básquet", type: "Cobertura deportiva" },
  { src: "/videos/mercedes.mp4", poster: "/videos/mercedes.jpg", client: "Producción creativa", type: "Video nocturno" },
  { src: "/videos/sketch-ia.mp4", poster: "/videos/sketch-ia.jpg", client: "AdVibe", type: "Sketch con IA" },
];

function ReelCard({ reel }: { reel: (typeof reels)[number] }) {
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
          src={reel.src}
          poster={reel.poster}
          muted
          loop
          playsInline
          preload="none"
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

export default function Showreel() {
  return (
    <section id="trabajo" className="relative bg-[#05070a] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">Nuestro trabajo</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
          Así se ve el contenido que hacemos para negocios del Azuay.
        </h2>
        <p className="mt-4 text-sm text-slate-500">Desliza para ver más →</p>
        <div className="-mx-6 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 sm:gap-6">
          {reels.map((reel) => (
            <ReelCard key={reel.src} reel={reel} />
          ))}
        </div>
      </div>
    </section>
  );
}
