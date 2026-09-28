import {properties as demoProperties,vehicles as demoVehicles,getProperty,getVehicle,type Property,type Vehicle} from "@/lib/enfoque-data";
import {getPublishedProperties,getPublishedProperty,getPublishedVehicle,getPublishedVehicles,supabaseConfigured} from "@/lib/enfoque-supabase";

// Única puerta de acceso al catálogo público.
// Regla: los datos demo (lib/enfoque-data.ts) NUNCA aparecen en producción.
// Solo se usan en desarrollo, o si alguien lo pide explícitamente con
// ENFOQUE_ALLOW_DEMO=true (p. ej. una preview sin Supabase).
// Si Supabase falla en producción, el catálogo sale vacío y se registra el error.

export function demoAllowed(env:Record<string,string|undefined>=process.env){
  if(env.ENFOQUE_ALLOW_DEMO==="true")return true;
  if(env.ENFOQUE_ALLOW_DEMO==="false")return false;
  return env.NODE_ENV!=="production";
}

async function load<T>(what:string,fromDb:()=>Promise<T>,demo:T,empty:T):Promise<T>{
  if(!supabaseConfigured()){
    if(demoAllowed())return demo;
    console.error(`[enfoque] Supabase no está configurado; ${what} vacío en producción.`);
    return empty;
  }
  try{return await fromDb();}
  catch(error){
    console.error(`[enfoque] Error leyendo ${what} desde Supabase:`,error);
    return demoAllowed()?demo:empty;
  }
}

export function loadProperties():Promise<Property[]>{
  return load("propiedades",getPublishedProperties,demoProperties,[]);
}
export function loadVehicles():Promise<Vehicle[]>{
  return load("vehículos",getPublishedVehicles,demoVehicles,[]);
}
export function loadProperty(slug:string):Promise<Property|undefined>{
  return load("propiedad "+slug,()=>getPublishedProperty(slug),getProperty(slug),undefined);
}
export function loadVehicle(slug:string):Promise<Vehicle|undefined>{
  return load("vehículo "+slug,()=>getPublishedVehicle(slug),getVehicle(slug),undefined);
}
