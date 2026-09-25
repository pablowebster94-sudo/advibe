"use client";

import Script from "next/script";

const AM_MOTORSPORT_PIXEL_ID = "1780546316542423";

export default function MetaPixel() {
  const isEnfoque =
    typeof window !== "undefined" &&
    (window.location.hostname === "enfoque.advibeagencia.com" ||
      window.location.hostname === "enfoquevisual.advibeagencia.com");

  const isAMMotorsport =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/drive/");

  const pixelId = isAMMotorsport
    ? AM_MOTORSPORT_PIXEL_ID
    : isEnfoque
      ? process.env.NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID
      : process.env.NEXT_PUBLIC_META_PIXEL_ID;

  if (!pixelId) return null;

  const code =
    "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +
    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;" +
    "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;" +
    "t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}" +
    "(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');" +
    "fbq('init','" + pixelId + "');fbq('track','PageView');";

  return <Script id="meta-pixel" strategy="afterInteractive">{code}</Script>;
}
