"use client";
import {useEffect} from "react";
import {track} from "./Tracking";

// ViewContent del producto al que llevó la tarjeta del carrusel (#toyota-gt86, etc.).
export function OportunidadView({items}:{items:{id:string;title:string;price:number}[]}){
  useEffect(()=>{
    const id=decodeURIComponent(location.hash.slice(1))||new URLSearchParams(location.search).get("utm_content")||"";
    const item=items.find(x=>x.id===id);
    if(item)track("ViewContent",{content_ids:[item.id],content_type:"product",content_name:item.title,value:item.price,currency:"USD"});
  },[items]);
  return null;
}
