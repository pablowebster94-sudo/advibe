"use client";
import {useEffect} from "react";

declare global{interface Window{fbq?:Function;gtag?:Function}}

function cookie(name:string){
  return document.cookie.split("; ").find(x=>x.startsWith(name+"="))?.split("=").slice(1).join("=") || null;
}
export function track(name:string,params:Record<string,unknown>={}) {
  const {event_id,...metaParams}=params;
  if(event_id) window.fbq?.("track",name,metaParams,{eventID:String(event_id)});
  else window.fbq?.("track",name,metaParams);
  window.gtag?.("event",name,metaParams);
}
export function getMetaBrowserData(){return {fbp:cookie("_fbp"),fbc:cookie("_fbc")};}
export function Tracking({id,type,value,name}:{id:string;type:string;value:number;name:string}){
  useEffect(()=>{track("ViewContent",{content_id:id,content_type:type,value,currency:"USD",content_name:name});},[id,type,value,name]);
  return null;
}
