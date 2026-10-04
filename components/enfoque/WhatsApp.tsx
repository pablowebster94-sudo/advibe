"use client";
import {track,sendServerEvent,contentType} from "./Tracking";

// Código corto que viaja en el mensaje de WhatsApp. Se guarda en conversion_events
// para que el panel identifique de qué publicación y campaña viene el chat.
function refCode(){
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes=crypto.getRandomValues(new Uint8Array(6));
  return "EV-"+Array.from(bytes,b=>alphabet[b%alphabet.length]).join("");
}

export function WhatsApp({message,id,type="property",value,city,ctaSource="ficha"}:{message:string;id?:string;type?:"property"|"vehicle"|"general";value?:number;city?:string;ctaSource?:string}){
  const n=(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||"").replace(/\D/g,"");
  // Sin número configurado no se muestra el botón (el formulario sigue capturando).
  // El estado real se revisa en /enfoque-visual/admin/estado.
  if(!n)return null;
  const onClick=()=>{
    const ref=refCode(); const eventId=crypto.randomUUID(); const ct=contentType(type);
    track("Contact",{content_ids:id?[id]:undefined,content_type:ct,value,currency:"USD",event_id:eventId,cta_source:ctaSource});
    sendServerEvent({event_name:"Contact",event_id:eventId,content_id:id,content_type:ct,
      property_id:type==="property"?id:undefined,vehicle_id:type==="vehicle"?id:undefined,value,city,cta_source:ctaSource,ref_code:ref});
    window.open("https://wa.me/"+n+"?text="+encodeURIComponent(message+" (Ref: "+ref+")"),"_blank","noopener,noreferrer");
  };
  return <button type="button" onClick={onClick} className="inline-flex w-full justify-center rounded-full bg-[#d9ff3f] px-6 py-3 text-sm font-black text-black transition hover:scale-[1.02]">Escribir por WhatsApp ↗</button>;
}
