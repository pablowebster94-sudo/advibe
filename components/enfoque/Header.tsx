import Link from "next/link";

export function Header(){
  return <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f5f3ee]/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
      <Link href="/enfoque-visual" className="ev-display text-xl font-black tracking-tight" aria-label="Enfoque Visual inicio">
        ENFOQUE<span className="text-black/35">VISUAL</span>
      </Link>
      <nav className="hidden items-center gap-7 text-sm font-bold md:flex" aria-label="Navegación principal">
        <Link href="/enfoque-visual/propiedades" className="hover:opacity-60">Propiedades</Link>
        <Link href="/enfoque-visual/alquiler" className="hover:opacity-60">Alquiler</Link>
        <Link href="/enfoque-visual/vehiculos" className="hover:opacity-60">Vehículos</Link>
        <Link href="/enfoque-visual/contacto" className="hover:opacity-60">Contacto</Link>
      </nav>
      <div className="flex items-center gap-2">
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-black/15 px-4 py-2 text-sm font-bold">Menú</summary>
          <nav className="absolute right-0 top-12 w-52 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-black/10" aria-label="Navegación móvil">
            <Link className="block rounded-xl px-3 py-3 text-sm font-bold hover:bg-black/5" href="/enfoque-visual/propiedades">Propiedades</Link>
            <Link className="block rounded-xl px-3 py-3 text-sm font-bold hover:bg-black/5" href="/enfoque-visual/alquiler">Alquiler</Link>
            <Link className="block rounded-xl px-3 py-3 text-sm font-bold hover:bg-black/5" href="/enfoque-visual/vehiculos">Vehículos</Link>
            <Link className="block rounded-xl px-3 py-3 text-sm font-bold hover:bg-black/5" href="/enfoque-visual/contacto">Contacto</Link>
          </nav>
        </details>
        <Link href="/enfoque-visual/contacto" className="rounded-full bg-black px-4 py-2 text-sm font-bold text-white hover:scale-[1.02]">
          Publicar
        </Link>
      </div>
    </div>
  </header>;
}
