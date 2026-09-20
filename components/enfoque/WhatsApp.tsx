"use client";
import {track} from "./Tracking";
export function WhatsApp({message,id,type="property",value}:{message:string;id?:string;type?:string;value?:number}){
  const n=process.env.NEXT_PUBLIC_WHATSAPP_NUMBER||"593999999999";
  const onClick=()=>{track("Contact",{content_id:id,content_type:type,value,currency:"USD"});try{const qs=new URLSearchParams(location.search);const keys=["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid","gclid"];const attribution:any={};keys.forEach(k=>{const v=qs.get(k);if(v)attribution[k]=v});navigator.sendBeacon?.("/api/enfoque/leads",new Blob([JSON.stringify({content_id:id,content_type:type,value,...attribution,status:"nuevo"})],{type:"application/json"}));}catch{}};
  return <a href={"https://wa.me/"+n+"?text="+encodeURIComponent(message)} target="_blank" rel="noreferrer" onClick={onClick} className="inline-flex rounded-full bg-[#d9ff3f] px-6 py-3 text-sm font-black text-black hover:scale-[1.02] transition">WhatsApp ↗</a>
}