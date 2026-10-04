import type {Metadata} from "next";

// Metadata por página de Enfoque. Open Graph se reemplaza entero al definirlo en una
// página (Next no lo fusiona con el del layout), por eso se arma completo aquí.
export const EV_SITE=(process.env.NEXT_PUBLIC_SITE_URL||"https://enfoque.advibeagencia.com").replace(/\/$/,"");

export function evMetadata({title,description,path,images,noindex,absolute}:{title:string;description:string;path:string;images?:string[];noindex?:boolean;absolute?:boolean}):Metadata{
  // Sin fotos propias se usa la imagen de marca (app/enfoque-visual/opengraph-image.tsx).
  const ogImages=images?.length?images.slice(0,1):[{url:"/enfoque-visual/opengraph-image",width:1200,height:630,alt:"Enfoque Visual"}];
  return {
    title:absolute?{absolute:title}:title,description,
    alternates:{canonical:path},
    openGraph:{title,description,url:path,siteName:"Enfoque Visual",locale:"es_EC",type:"website",images:ogImages},
    twitter:{card:"summary_large_image",title,description,images:ogImages},
    ...(noindex?{robots:{index:false,follow:true}}:{})
  };
}

export function breadcrumbs(items:Array<[string,string]>){
  return {"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:items.map(([name,path],i)=>({"@type":"ListItem",position:i+1,name,item:EV_SITE+path}))};
}

/** JSON seguro para <script type="application/ld+json">. */
export const jsonLd=(data:unknown)=>({__html:JSON.stringify(data).replace(/</g,"\\u003c")});
