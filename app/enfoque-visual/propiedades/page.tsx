import type {Metadata} from "next";
import {evMetadata} from "@/lib/enfoque-seo";
import {PropertyCatalog} from "@/components/enfoque/PropertyCatalog";
export const dynamic="force-dynamic";
export const metadata:Metadata=evMetadata({title:"Propiedades en venta y alquiler",description:"Casas, departamentos y terrenos en Cuenca, Gualaceo y Azuay con fotos, video e información clara.",path:"/propiedades"});
export default async function Page({searchParams}:{searchParams:Promise<{[key:string]:string|string[]|undefined}>}){
  return <PropertyCatalog searchParams={await searchParams} action="/enfoque-visual/propiedades" title="Propiedades" intro="Casas, departamentos, terrenos y locales con fotografía, video e información clara."/>;
}
