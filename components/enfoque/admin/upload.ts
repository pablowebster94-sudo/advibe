// Subida de imágenes desde el navegador (una petición por archivo, como exige el endpoint).
export type ImageItem={id:string;storage_path:string;is_cover:boolean;sort_order:number;alt_text?:string|null};

function dimensions(file:File):Promise<{width:number;height:number}|null>{
  return new Promise(resolve=>{
    const url=URL.createObjectURL(file);const img=new Image();
    img.onload=()=>{resolve({width:img.naturalWidth,height:img.naturalHeight});URL.revokeObjectURL(url);};
    img.onerror=()=>{resolve(null);URL.revokeObjectURL(url);};
    img.src=url;
  });
}

export async function uploadImage(file:File,type:"property"|"vehicle",listingId:string,alt:string):Promise<ImageItem>{
  const fd=new FormData();
  fd.append("file",file);
  fd.append(type==="property"?"property_id":"vehicle_id",listingId);
  fd.append("alt",alt);
  const d=await dimensions(file);
  if(d){fd.append("width",String(d.width));fd.append("height",String(d.height));}
  const r=await fetch("/api/enfoque/admin/listing-images",{method:"POST",body:fd});
  const data=await r.json().catch(()=>({}));
  if(!r.ok)throw new Error(data.error||`No se pudo subir ${file.name}`);
  return data.item;
}

export const MAX_MB=8;
export const ACCEPT="image/jpeg,image/png,image/webp,image/avif";
export function checkFile(file:File){
  if(!ACCEPT.split(",").includes(file.type))return `${file.name}: formato no permitido.`;
  if(file.size>MAX_MB*1024*1024)return `${file.name} supera ${MAX_MB} MB.`;
  return null;
}
export const publicUrl=(p:string)=>`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-media/${p}`;
