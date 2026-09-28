"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {uploadImage} from "./upload";

// Guarda (crea o edita) y, si es nueva, sube las fotos pendientes en orden: la primera queda de portada.
export function useListingSave({type,id,endpoint,adminPath}:{type:"property"|"vehicle";id?:string;endpoint:string;adminPath:string}){
  const router=useRouter();
  const [msg,setMsg]=useState("");
  const [busy,setBusy]=useState(false);
  async function save(payload:Record<string,unknown>,files:File[],alt:string){
    setBusy(true);setMsg("Guardando…");
    try{
      const r=await fetch(id?endpoint+"/"+id:endpoint,{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok){setMsg(d.error||"No se pudo guardar.");return;}
      if(id){setMsg("Guardado correctamente.");router.refresh();return;}
      const newId=d.item.id as string;const errors:string[]=[];
      for(const [i,file] of files.entries()){
        setMsg(`Publicación creada. Subiendo foto ${i+1} de ${files.length}…`);
        try{await uploadImage(file,type,newId,alt);}catch(e){errors.push((e as Error).message);}
      }
      router.push(`${adminPath}/${newId}${errors.length?"?fotos=error":"?creada=1"}`);
    }finally{setBusy(false);}
  }
  async function remove(){
    if(!id||!confirm("¿Eliminar definitivamente esta publicación y sus fotos?"))return;
    const r=await fetch(endpoint+"/"+id,{method:"DELETE"});
    if(r.ok)router.push(adminPath);else setMsg("No se pudo eliminar.");
  }
  return {msg,busy,save,remove};
}
