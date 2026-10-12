import Link from "next/link";

const BASE="/enfoque-visual/busco-propiedad";
/** Enlace a "Busco propiedad" con el formulario prellenado (?tipo=casa&canton=gualaceo&operacion=venta). */
export function buscoHref(prefill:{tipo?:string;canton?:string;operacion?:string}={}){
  const q=new URLSearchParams(Object.entries(prefill).filter((e):e is [string,string]=>Boolean(e[1])));
  const qs=q.toString();
  return qs?`${BASE}?${qs}`:BASE;
}

// CTA de captación de demanda: "¿No es lo que buscas? Cuéntanos qué buscas".
export function BuscoCta({variant="inline",prefill,title="¿No es lo que buscas?",text="Cuéntanos qué buscas y te avisamos por WhatsApp cuando tengamos opciones."}:{variant?:"inline"|"banner";prefill?:Parameters<typeof buscoHref>[0];title?:string;text?:string}){
  const href=buscoHref(prefill);
  if(variant==="banner")return <section className="bg-black px-5 py-16 text-white"><div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-end md:justify-between">
    <div><h2 className="ev-display text-5xl font-black leading-[.95] md:text-6xl">{title}</h2><p className="mt-4 max-w-xl text-white/60">{text}</p></div>
    <Link href={href} className="inline-flex shrink-0 justify-center rounded-full bg-[#d9ff3f] px-7 py-4 font-black text-black">Cuéntanos qué buscas ↗</Link>
  </div></section>;
  return <div className="mt-10 flex flex-col gap-4 rounded-3xl bg-[#d9ff3f] p-6 sm:flex-row sm:items-center sm:justify-between">
    <div><p className="text-xl font-black">{title}</p><p className="mt-1 text-sm text-black/65">{text}</p></div>
    <Link href={href} className="inline-flex shrink-0 justify-center rounded-full bg-black px-6 py-3 text-sm font-black text-white">Cuéntanos qué buscas ↗</Link>
  </div>;
}
