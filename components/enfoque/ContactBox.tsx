import {WhatsApp} from "./WhatsApp";
import {LeadForm} from "./LeadForm";

// Caja de conversión de la ficha: WhatsApp → Contact, formulario → Lead.
export function ContactBox({id,type,value,city,title,message,interest,unavailable}:{id:string;type:"property"|"vehicle";value:number;city?:string;title:string;message:string;interest:"comprar_propiedad"|"alquilar_propiedad"|"comprar_vehiculo";unavailable?:string}){
  return <aside id="solicitar" className="h-fit scroll-mt-24 rounded-3xl bg-black p-6 text-white lg:sticky lg:top-24">
    <p className="text-white/50">¿Te interesa?</p>
    <h2 className="mt-1 text-2xl font-black">Solicita información</h2>
    {unavailable?<p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">Estado: {unavailable}. Déjanos tus datos y te avisamos de opciones similares.</p>:<p className="mt-3 text-sm leading-6 text-white/60">Consulta disponibilidad y agenda una visita.</p>}
    <div className="mt-5"><WhatsApp message={message} id={id} type={type} value={value} city={city}/></div>
    <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[.14em] text-white/35"><span className="h-px flex-1 bg-white/15"/>o déjanos tus datos<span className="h-px flex-1 bg-white/15"/></div>
    <LeadForm id={id} type={type} value={value} interest={interest} title={title}/>
  </aside>;
}

export function MobileCta(){
  return <a href="#solicitar" className="fixed inset-x-4 bottom-4 z-30 rounded-full bg-[#d9ff3f] px-6 py-4 text-center text-sm font-black text-black shadow-2xl lg:hidden">Solicitar información</a>;
}
