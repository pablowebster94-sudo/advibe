"use client";
import {useEffect} from "react";

declare global{interface Window{fbq?:(...args:unknown[])=>void;gtag?:(...args:unknown[])=>void}}

function cookie(name:string){
  return document.cookie.split("; ").find(x=>x.startsWith(name+"="))?.split("=").slice(1).join("=") || null;
}

// El Pixel (components/MetaPixel.tsx) se inyecta después de la hidratación, así que
// los efectos de la página (p. ej. ViewContent al abrir una ficha) pueden correr
// antes de que exista window.fbq. Se reintenta hasta ~6 s en vez de perder el evento.
function whenReady(name:"fbq"|"gtag",call:(fn:(...args:unknown[])=>void)=>void,tries=0){
  const fn=window[name];
  if(fn){call(fn);return;}
  if(tries<40)setTimeout(()=>whenReady(name,call,tries+1),150);
}

// trackSingle: los eventos de Enfoque solo van a su pixel, aunque en la pestaña se haya
// iniciado también el de AdVibe (navegación interna desde el sitio principal).
const EV_PIXEL=process.env.NEXT_PUBLIC_ENFOQUE_META_PIXEL_ID;

export function track(name:string,params:Record<string,unknown>={}) {
  const {event_id,...metaParams}=params;
  if(EV_PIXEL)whenReady("fbq",fbq=>event_id?fbq("trackSingle",EV_PIXEL,name,metaParams,{eventID:String(event_id)}):fbq("trackSingle",EV_PIXEL,name,metaParams));
  whenReady("gtag",gtag=>gtag("event",name,metaParams));
}

export function getMetaBrowserData(){return {fbp:cookie("_fbp"),fbc:cookie("_fbc")};}

export const contentType=(type:string)=>type==="property"?"home_listing":type;

/** Envía un evento al servidor (CAPI) sin bloquear la navegación. */
export function sendServerEvent(payload:Record<string,unknown>){
  const body=JSON.stringify({...payload,event_source_url:location.href,...getMetaBrowserData()});
  if(navigator.sendBeacon?.("/api/enfoque/track",new Blob([body],{type:"application/json"})))return;
  fetch("/api/enfoque/track",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>{});
}

export function Tracking({id,type,value,name}:{id:string;type:"property"|"vehicle";value:number;name:string}){
  useEffect(()=>{
    const eventId=crypto.randomUUID();
    track("ViewContent",{content_ids:[id],content_type:contentType(type),value,currency:"USD",content_name:name,event_id:eventId});
    // Espera un poco para que el Pixel cree _fbp y el servidor lo reciba.
    const t=setTimeout(()=>sendServerEvent({event_name:"ViewContent",event_id:eventId,content_id:id,content_type:contentType(type),value,
      property_id:type==="property"?id:undefined,vehicle_id:type==="vehicle"?id:undefined}),1500);
    return ()=>clearTimeout(t);
  },[id,type,value,name]);
  return null;
}
