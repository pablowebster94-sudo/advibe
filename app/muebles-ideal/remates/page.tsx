import type { Metadata } from "next";
import { BotonFlotante, Filtros, Rejilla } from "@/components/remates/Catalogo";
import { cargarRemates, MUEBLES_IDEAL as C, whatsapp } from "@/lib/remates-data";
import { categorias, filtrar, ordenar } from "@/lib/remates";

const RUTA = "/muebles-ideal/remates";

export const metadata: Metadata = {
  title: "Remates y liquidaciones | Muebles Ideal",
  description: "Muebles de exhibición y fin de temporada en remate: dormitorios, salas, comedores y colchones en Gualaceo y Montecristi. Stock limitado.",
  alternates: { canonical: RUTA },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export default async function Page({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const todos = await cargarRemates(C);
  const cat = (await searchParams).cat;
  const actual = typeof cat === "string" && cat.trim() ? cat : "todo";
  const items = ordenar(filtrar(todos, actual));
  const wa = whatsapp(C);
  const disponibles = todos.filter((x) => !x.vendido).length;

  return <>
    <main className="mx-auto max-w-7xl px-5 py-12 sm:py-16">
      <header>
        <span className="inline-flex items-center gap-2 rounded-full bg-[#ff3b30]/10 px-4 py-1.5 text-xs font-black uppercase tracking-[.16em] text-[#ff3b30]">
          🔥 {C.negocio}
        </span>
        <h1 className="mt-4 text-5xl font-black leading-[0.95] sm:text-6xl">
          {C.titulo} <em className="not-italic text-[#ff3b30]">{C.resaltado}</em>
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-black/55">{C.subtitulo}</p>
        {disponibles > 0 && <p className="mt-3 text-sm font-bold text-black/40">
          {disponibles} {disponibles === 1 ? "mueble disponible" : "muebles disponibles"}
        </p>}
      </header>
      <Filtros base={RUTA} cats={categorias(todos)} actual={actual} total={todos.length} />
      <Rejilla items={items} wa={wa} negocio={C.negocio} />
      <footer className="mt-16 border-t border-black/10 pt-6 text-xs text-black/40">
        Precios sujetos a disponibilidad. Las medidas son aproximadas.
      </footer>
    </main>
    <BotonFlotante wa={wa} negocio={C.negocio} />
  </>;
}
