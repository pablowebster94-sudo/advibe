import type {Metadata} from "next";
import {Header} from "@/components/enfoque/Header";
import {Footer} from "@/components/enfoque/Footer";
import {WhatsApp} from "@/components/enfoque/WhatsApp";
import {ContactForm} from "@/components/enfoque/ContactForm";
import {evMetadata} from "@/lib/enfoque-seo";

export const metadata:Metadata=evMetadata({title:"Contacto",description:"Publica tu propiedad o vehículo con fotografía, video y campañas de captación, o pide información sobre una publicación.",path:"/contacto"});

export default async function Contacto({searchParams}:{searchParams:Promise<{tipo?:string}>}){
  const tipo=(await searchParams).tipo;
  const initial=tipo==="propiedad"||tipo==="vehiculo"?"publicar_"+tipo:undefined;
  return <><Header/><main className="mx-auto max-w-6xl px-5 py-14 md:py-20"><div className="grid gap-12 lg:grid-cols-[1fr_520px] lg:items-start">
    <section><p className="text-xs font-black uppercase tracking-[.22em] text-black/40">Enfoque Visual · Contacto</p><h1 className="ev-display mt-4 text-6xl font-black leading-[.9] md:text-8xl">Hablemos de lo que quieres publicar.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-black/60">¿Tienes una propiedad o vehículo? Déjanos tus datos y te contactaremos para revisar la publicación y el proceso de captación.</p><div className="mt-10 rounded-3xl bg-[#d9ff3f] p-6"><p className="text-sm font-black uppercase tracking-[.18em]">Enfoque Visual × AdVibe</p><p className="mt-3 text-2xl font-black">Contenido + publicación + captación medible.</p></div><div className="mt-6 max-w-xs"><WhatsApp type="general" ctaSource="contacto" message="Hola, quiero información de Enfoque Visual."/></div></section>
    <ContactForm initialInterest={initial}/></div></main><Footer/></>;
}
