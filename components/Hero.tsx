"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import EventButton from "@/components/EventButton";

// Spot vertical de AdVibe (9:16, sin audio, ~1,5 MB). En celular es el fondo a pantalla completa;
// en escritorio se muestra como reel a la derecha del título. Si no carga, queda el fondo degradado.
const HERO_VIDEO_MP4 = "/videos/hero-reel.mp4";
const HERO_VIDEO_WEBM = "/videos/hero-reel.webm";
const HERO_POSTER = "/videos/hero-reel-poster.jpg";

const proof = [
  { value: "+2.800", label: "conversaciones por WhatsApp" },
  { value: "$0,54", label: "costo promedio por conversación" },
  { value: "250", label: "campañas gestionadas" },
];

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (reducedMotion) video.pause();
    else video.play().catch(() => {});
  }, [reducedMotion]);

  return (
    <section id="home" className="relative isolate flex min-h-[calc(100svh-5rem)] items-end overflow-hidden bg-[#05070a] px-6 pb-12 pt-20 sm:pb-16 lg:px-10">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_70%_30%,rgba(120,217,79,0.16),transparent_35%),radial-gradient(circle_at_15%_80%,rgba(36,86,145,0.18),transparent_40%),linear-gradient(135deg,#05070a_0%,#071018_58%,#07100b_100%)]" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#05070a] via-[#05070a]/60 to-[#05070a]/20 lg:hidden" />

      <div className="mx-auto grid w-full max-w-7xl items-end gap-12 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16">
        <div className="absolute inset-0 -z-20 opacity-45 lg:relative lg:inset-auto lg:z-0 lg:order-2 lg:self-center lg:opacity-100">
          <div style={{ backgroundImage: `url(${HERO_POSTER})` }} className="h-full w-full bg-cover bg-center lg:relative lg:h-[min(72svh,640px)] lg:w-auto lg:aspect-[9/16] lg:overflow-hidden lg:rounded-[2rem] lg:border lg:border-white/10 lg:shadow-[0_40px_120px_-40px_rgba(120,217,79,.45)]">
            <video
              ref={videoRef}
              className={`h-full w-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-100" : "opacity-0"}`}
              poster={HERO_POSTER}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-hidden="true"
              onCanPlay={() => setVideoReady(true)}
            >
              <source src={HERO_VIDEO_WEBM} type="video/webm" />
              <source src={HERO_VIDEO_MP4} type="video/mp4" />
            </video>
          </div>
        </div>
      <div>
        <p className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-lime-300/90">
          <span className="h-px w-8 bg-lime-300" /> Agencia de marketing digital · Azuay, Ecuador
        </p>
        <h1 className="max-w-5xl text-[clamp(3.2rem,6.4vw,6.6rem)] font-semibold leading-[0.88] tracking-[-0.07em] text-white">
          Hacemos que tu negocio <span className="text-lime-300">se vea</span> y se venda.
        </h1>
        <p className="mt-8 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
          Grabamos tu contenido y gestionamos tus anuncios en Facebook e Instagram para que más personas te escriban por WhatsApp.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <EventButton href="#contacto" eventName="hero_diagnostic_cta" eventParams={{ source: "video_hero" }} leadOnClick className="inline-flex items-center justify-center rounded-full bg-lime-400 px-7 py-4 text-sm font-semibold text-[#07101a] shadow-[0_18px_60px_-25px_rgba(120,217,79,.7)] hover:-translate-y-1 hover:bg-lime-300">Diagnóstico gratis <span className="ml-2">↗</span></EventButton>
          <Button href="#portafolio" variant="secondary" className="rounded-full border-white/20 bg-black/30 px-7 py-4 text-white backdrop-blur hover:border-white/40 hover:bg-white/10">Ver casos</Button>
        </div>

        <dl className="mt-14 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur sm:grid-cols-3">
          {proof.map((item) => (
            <div key={item.label} className="bg-black/40 px-3 py-3 sm:px-5 sm:py-4">
              <dt className="sr-only">{item.label}</dt>
              <dd className="text-lg font-semibold sm:text-2xl tracking-[-0.03em] text-white">{item.value}</dd>
              <dd className="mt-1 text-[10px] leading-4 text-slate-400 sm:text-xs">{item.label}</dd>
            </div>
          ))}
        </dl>
      </div>
      </div>
    </section>
  );
}
