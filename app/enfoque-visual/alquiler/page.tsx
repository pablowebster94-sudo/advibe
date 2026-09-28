import type {Metadata} from "next";
import {PropertyCatalog} from "@/components/enfoque/PropertyCatalog";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Propiedades en alquiler | Enfoque Visual",description:"Departamentos, casas y locales en alquiler en Cuenca y Azuay.",alternates:{canonical:"/alquiler"}};
export default async function Page({searchParams}:{searchParams:Promise<{[key:string]:string|string[]|undefined}>}){
  return <PropertyCatalog searchParams={await searchParams} action="/enfoque-visual/alquiler" title="Alquiler" intro="Propiedades disponibles para arrendar. El precio indicado es mensual." operation="alquiler"/>;
}
