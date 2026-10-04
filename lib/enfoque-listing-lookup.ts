import {supabaseAdmin} from "@/lib/enfoque-supabase";
import type {PropertyRow,VehicleRow} from "@/lib/enfoque-types";

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const asUuid=(v:unknown)=>typeof v==="string"&&UUID.test(v)?v:null;

export type ListingRef={property_id:string|null;vehicle_id:string|null;price?:number;city?:string|null;label?:string};

/** Confirma en la BD que la publicación existe y devuelve su precio real (no se confía en el navegador). */
export async function resolveListing(propertyId:unknown,vehicleId:unknown):Promise<ListingRef>{
  const pid=asUuid(propertyId),vid=pid?null:asUuid(vehicleId);
  try{
    if(pid){
      const rows=await supabaseAdmin<Pick<PropertyRow,"id"|"title"|"price"|"city">[]>(`properties?id=eq.${pid}&select=id,title,price,city&limit=1`);
      if(rows[0])return {property_id:pid,vehicle_id:null,price:Number(rows[0].price),city:rows[0].city,label:rows[0].title};
    }
    if(vid){
      const rows=await supabaseAdmin<Pick<VehicleRow,"id"|"brand"|"model"|"year"|"price"|"city">[]>(`vehicles?id=eq.${vid}&select=id,brand,model,year,price,city&limit=1`);
      if(rows[0])return {property_id:null,vehicle_id:vid,price:Number(rows[0].price),city:rows[0].city,label:`${rows[0].brand} ${rows[0].model} ${rows[0].year}`};
    }
  }catch(error){console.error("[enfoque] No se pudo verificar la publicación:",error);}
  return {property_id:null,vehicle_id:null};
}
