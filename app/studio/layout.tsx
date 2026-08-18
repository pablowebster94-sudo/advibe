import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AdVibe AI Photo Editor",
  description:
    "Análisis y edición fotográfica automática con generación de XMP para Lightroom Classic.",
  // The studio holds the photographer's own work; it must never be indexed.
  robots: { index: false, follow: false },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="advibe-studio">
      <header className="sticky top-0 z-30 border-b border-neutral-800 bg-[#0b0b0d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-3 py-2 sm:px-5">
          <Link href="/studio" className="text-sm font-semibold tracking-tight text-neutral-100">
            AdVibe <span className="text-[#78d94f]">AI Photo Editor</span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 text-sm">
            <Link
              href="/studio"
              className="rounded-lg px-3 py-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
            >
              Proyectos
            </Link>
            <Link
              href="/studio/estilos"
              className="rounded-lg px-3 py-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
            >
              Mi estilo
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5">{children}</main>
    </div>
  );
}
