import Image from "next/image";

// Optimiza (AVIF/WebP, tamaños responsive) las fotos servidas desde Supabase Storage.
// Orígenes que el optimizador no puede usar (p. ej. Supabase local en desarrollo) van sin optimizar.
function optimizable(src:string){
  try{
    const u=new URL(src);
    if(u.protocol!=="https:")return false;
    return u.hostname.endsWith(".supabase.co")||u.hostname==="images.unsplash.com"||src.startsWith(process.env.NEXT_PUBLIC_SUPABASE_URL||"\u0000");
  }catch{return false;}
}

export function ListingImage({src,alt,sizes,priority,className="object-cover"}:{src:string;alt:string;sizes:string;priority?:boolean;className?:string}){
  return <Image src={src} alt={alt} fill sizes={sizes} loading={priority?"eager":"lazy"} fetchPriority={priority?"high":undefined} unoptimized={!optimizable(src)} className={className}/>;
}
