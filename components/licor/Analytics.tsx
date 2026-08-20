"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { GA4_ID, META_PIXEL_ID, hasGa4, hasMetaPixel, track } from "@/lib/licor/analytics";

/**
 * Meta Pixel + GA4 loaders.
 *
 * Both are driven by environment variables and render nothing when unset, so
 * the storefront never ships a fake or placeholder measurement id:
 *   NEXT_PUBLIC_META_PIXEL_ID = "META_PIXEL_ID"
 *   NEXT_PUBLIC_GA4_ID        = "G-XXXXXXXXXX"
 */
export function AnalyticsScripts() {
  return (
    <>
      {hasMetaPixel ? (
        <>
          <Script id="licor-meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(META_PIXEL_ID)});`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(META_PIXEL_ID)}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {hasGa4 ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="licor-ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(GA4_ID)}, { send_page_view: false });`}
          </Script>
        </>
      ) : null}

      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}

/** Fires PageView on the first render and on every client-side navigation. */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    if (lastPath.current === url) return;
    lastPath.current = url;
    track("PageView", { page_path: url });
  }, [pathname, searchParams]);

  return null;
}
