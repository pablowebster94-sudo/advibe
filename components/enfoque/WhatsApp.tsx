"use client";
import {track,getMetaBrowserData} from "./Tracking";
function refCode(){return "EV-"+Math.random().toString(36).slice(2,7).toUpperCase();}
export function WhatsApp({message,id,type="property",value,city,ctaSource="ficha"}:{message:string;id?:string;type?:string;value?:number;city?:string;ctaSource?:string}){
  const n=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const onClick=()=>{
    const ref=refCode(); const eventId=crypto.randomUUID(); const meta=getMetaBrowserData();
    track("Contact",{content_id:id,content_type:type,value,currency:"USD",event_id:eventId,cta_source:ctaSource});
    navigator.sendBeacon?.("/api/enfoque/track",new Blob([JSON.stringify({
      event_name:"Contact",event_id:eventId,content_id:id,content_type:type==="property"?"home_listing":type,property_id:type==="property"?id:undefined,vehicle_id:type==="vehicle"?id:undefined,
      value,currency:"USD",city,cta_source:ctaSource,ref_code:ref,event_source_url:location.href,...meta
    })],{type:"application/json"}));
    window.open("https://wa.me/"+(n||"").replace(/\D/g,"")+"?text="+encodeURIComponent(message+" (Ref: "+ref+")"),"_blank","noopener,noreferrer");
  };
  // Sin número configurado no se muestra el botón (el formulario de la ficha sigue capturando).
  // El estado real se revisa en /enfoque-visual/admin/estado.
  if(!n)return null;
  return <button type="button" onClick={onClick} className="inline-flex w-full justify-center rounded-full bg-[#d9ff3f] px-6 py-3 text-sm font-black text-black hover:scale-[1.02] transition">Escribir por WhatsApp ↗</button>;
}
