import type {MetadataRoute} from "next";
import {loadProperties,loadVehicles} from "@/lib/enfoque-catalog";

// En enfoque.advibeagencia.com el middleware sirve esto como /sitemap.xml.
export const dynamic="force-dynamic";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const base=(process.env.NEXT_PUBLIC_SITE_URL||"https://enfoque.advibeagencia.com").replace(/\/$/,"");
  const [properties,vehicles]=await Promise.all([loadProperties(),loadVehicles()]);
  const now=new Date();
  return [
    {url:base,lastModified:now,changeFrequency:"daily",priority:1},
    ...["propiedades","alquiler","vehiculos"].map(p=>({url:`${base}/${p}`,lastModified:now,changeFrequency:"daily" as const,priority:0.9})),
    {url:`${base}/busco-propiedad`,changeFrequency:"monthly",priority:0.7},
    {url:`${base}/contacto`,changeFrequency:"monthly",priority:0.5},
    {url:`${base}/publicar`,changeFrequency:"monthly",priority:0.5},
    ...properties.map(x=>({url:`${base}/propiedades/${x.slug}`,changeFrequency:"weekly" as const,priority:0.8,images:x.images.slice(0,3)})),
    ...vehicles.map(x=>({url:`${base}/vehiculos/${x.slug}`,changeFrequency:"weekly" as const,priority:0.8,images:x.images.slice(0,3)}))
  ];
}
