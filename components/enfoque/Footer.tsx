import Link from "next/link";

export function Footer({buscoCta=true,mobileCtaSpace=false}:{buscoCta?:boolean;mobileCtaSpace?:boolean}){
  return <footer className={"border-t border-black/10 bg-[#f5f3ee] px-5 pt-10 "+(mobileCtaSpace?"pb-28 lg:pb-10":"pb-10")}>
    <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <Link href="/enfoque-visual" className="ev-display text-xl font-black tracking-tight">ENFOQUE<span className="text-black/35">VISUAL</span></Link>
        <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-black/60" aria-label="Pie de página">
          <Link href="/enfoque-visual/propiedades" className="hover:text-black">Propiedades</Link>
          <Link href="/enfoque-visual/alquiler" className="hover:text-black">Alquiler</Link>
          <Link href="/enfoque-visual/vehiculos" className="hover:text-black">Vehículos</Link>
          <Link href="/enfoque-visual/busco-propiedad" className="hover:text-black">Busco propiedad</Link>
          <Link href="/enfoque-visual/publicar" className="hover:text-black">Publicar</Link>
          <Link href="/enfoque-visual/contacto" className="hover:text-black">Contacto</Link>
        </nav>
        <p className="mt-6 text-xs text-black/45">Enfoque Visual es una marca de AdVibe Agencia · Ecuador</p>
      </div>
      {buscoCta&&<div className="rounded-3xl bg-black p-5 text-white md:max-w-sm"><p className="font-black">¿No encuentras lo que buscas?</p><p className="mt-1 text-sm text-white/60">Dinos qué buscas y te avisamos.</p><Link href="/enfoque-visual/busco-propiedad" className="mt-4 inline-flex rounded-full bg-[#d9ff3f] px-5 py-2 text-sm font-black text-black">Cuéntanos qué buscas ↗</Link></div>}
    </div>
  </footer>;
}
