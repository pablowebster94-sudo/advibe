"use client";

import Script from "next/script";
import {useEffect,useRef} from "react";
import {usePathname} from "next/navigation";

const AM_MOTORSPORT_PIXEL_ID = "1780546316542423";
const ENFOQUE_HOSTS = ["enfoque.advibeagencia.com", "enfoquevisual.advibeagencia.com"];

export function isEnfoqueLocation(hostname: string, pathname: string) {
  return ENFOQUE_HOSTS.includes(hostname) || pathname.startsWith("/enfoque-visual");
}

export default function MetaPixel() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  const isEnfoque =
    typeof window !== "undefined" && isEnfoqueLocation(window.location.hostname, window.location.pathname);

  const isAMMotorsport =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/drive/");

  const pixelId = isAMMotorsport
    ? AM_MOTORSPORT_PIXEL_ID
    : isEnfoque
      ? process.env.NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID
      : process.env.NEXT_PUBLIC_META_PIXEL_ID;

  // PageView en cada navegación del cliente, solo para el pixel de Enfoque.
  // El PageView de la carga inicial lo dispara el script de abajo: el primer valor de la ruta
  // solo se memoriza (también evita el doble efecto de StrictMode). trackSingle envía el evento
  // únicamente al pixel de Enfoque aunque en la página se hubiera iniciado otro (AdVibe).
  useEffect(() => {
    if (lastPath.current === null || lastPath.current === pathname) {
      lastPath.current = pathname;
      return;
    }
    lastPath.current = pathname;
    const enfoqueId = process.env.NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID;
    if (!enfoqueId || !window.fbq || !isEnfoqueLocation(window.location.hostname, window.location.pathname)) return;
    const initialized = window.__evPixelInit ?? new Set<string>();
    window.__evPixelInit = initialized;
    if (!initialized.has(enfoqueId)) {
      // Se llegó a Enfoque navegando desde otra parte del sitio: el pixel cargado era otro.
      window.fbq("init", enfoqueId);
      initialized.add(enfoqueId);
    }
    window.fbq("trackSingle", enfoqueId, "PageView");
  }, [pathname]);

  if (!pixelId) return null;

  const code =
    "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +
    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;" +
    "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;" +
    "t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}" +
    "(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
    "fbq('init','" + pixelId + "');fbq('track','PageView');" +
    "(window.__evPixelInit=window.__evPixelInit||new Set()).add('" + pixelId + "');";

  return <Script id="meta-pixel" strategy="afterInteractive">{code}</Script>;
}

declare global {
  interface Window {
    __evPixelInit?: Set<string>;
  }
}
