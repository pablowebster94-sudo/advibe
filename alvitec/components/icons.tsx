import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true, focusable: false } as const;
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const WhatsAppIcon = (p: P) => (
  <svg {...base} fill="currentColor" {...p}>
    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24Zm-3.52 4.2c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.76 2.67 4.25 3.74.59.26 1.05.41 1.41.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29-.25-.13-1.47-.73-1.7-.81-.22-.08-.39-.12-.55.13-.17.25-.64.8-.78.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.84-.2-.49-.4-.42-.55-.43l-.47-.01Z" />
  </svg>
);
export const ArrowUpRight = (p: P) => (
  <svg {...base} {...stroke} {...p}><path d="M7 17 17 7M8 7h9v9" /></svg>
);
export const ArrowRight = (p: P) => (
  <svg {...base} {...stroke} {...p}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
export const ArrowLeft = (p: P) => (
  <svg {...base} {...stroke} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base} {...stroke} {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base} {...stroke} {...p}><path d="M4 8h16M4 16h16" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base} {...stroke} {...p}><path d="M12 5v14M5 12h14" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base} {...stroke} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const InstagramIcon = (p: P) => (
  <svg {...base} {...stroke} {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" /><circle cx="12" cy="12" r="3.8" /><circle cx="17" cy="7" r=".6" fill="currentColor" /></svg>
);
export const FacebookIcon = (p: P) => (
  <svg {...base} {...stroke} {...p}><path d="M14 8.5V7c0-1 .5-1.5 1.5-1.5H17V3h-2.5C12 3 10.5 4.5 10.5 7v1.5H8V11h2.5v10H14V11h2.6l.4-2.5H14Z" /></svg>
);
