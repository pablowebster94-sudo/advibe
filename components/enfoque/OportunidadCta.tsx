"use client";
import {track} from "./Tracking";

// Botón de WhatsApp de /oportunidades. Registra Contact en el Pixel (si está configurado)
// con el producto, para medir qué tarjeta del carrusel trae los contactos.
export function OportunidadCta({id,title,price,number}:{id:string;title:string;price:number;number:string}){
  if(!number)return <a href="/enfoque-visual/contacto" className="inline-flex w-full justify-center rounded-full bg-black px-6 py-3 text-sm font-black text-white">Quiero información ↗</a>;
  const onClick=()=>{
    track("Contact",{content_ids:[id],content_type:"product",value:price,currency:"USD",cta_source:"oportunidades"});
    const text=`Hola, vi en Enfoque Visual: ${title} (${new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(price)}). Quiero más información.`;
    window.open("https://wa.me/"+number+"?text="+encodeURIComponent(text),"_blank","noopener,noreferrer");
  };
  return <button type="button" onClick={onClick} className="inline-flex w-full justify-center rounded-full bg-[#d9ff3f] px-6 py-3 text-sm font-black text-black transition hover:scale-[1.02]">Me interesa · escribir por WhatsApp ↗</button>;
}
