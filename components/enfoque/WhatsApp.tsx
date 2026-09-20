"use client";
import {track} from "./Tracking";
function refCode(){return "EV-"+Math.random().toString(36).slice(2,7).toUpperCase();}
export function WhatsApp({message,id,type="property",value,city,ctaSource="ficha"}:{message:string;id?:string;type?:string;value?:number;city?:string;ctaSource?:string}){
  const n=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  const onClick=()=>{
    const ref=refCode();
    const eventId=crypto.randomUUID();
    track("Contact",{content_id:id,content_type:type,value,currency:"USD",event_id:eventId,cta_source:ctaSource});
    navigator.sendBeacon?.("/api/enfoque/track",new Blob([JSON.stringify({
      event_name:"Contact",event_id:eventId,property_id:type==="property"?id:undefined,vehicle_id:type==="vehicle"?id:undefined,
      value,currency:"USD",city,cta_source:ctaSource,ref_code:ref,event_source_url:location.href
    })],{type:"application/json"}));
    const text=`${message} (Ref: ${ref})`;
    window.open("https://wa.me/"+(n||"")+"?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
  };
  if(!n) return <span className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-black text-white/60">WhatsApp pendiente de configurar</span>;
  return <button type="button" onClick={onClick} className="inline-flex rounded-full bg-[#d9ff3f] px-6 py-3 text-sm font-black text-black hover:scale-[1.02] transition">WhatsApp ↗</button>;
}
