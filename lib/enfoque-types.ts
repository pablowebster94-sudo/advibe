// Filas de Supabase (supabase/schema.sql) tal como las devuelve PostgREST.
// numeric llega como string o number según la columna; por eso se tipan como number|string.
type Num=number|string;

export type ImageRow={id:string;property_id:string|null;vehicle_id:string|null;storage_path:string;alt_text:string|null;width:number|null;height:number|null;sort_order:number;is_cover:boolean;created_at?:string};

type ListingBase={id:string;slug:string;price:Num;currency:string;description:string|null;features:string[]|null;video_url:string|null;cover_path:string|null;
  publication_status:"borrador"|"publicado"|"archivado";availability:"disponible"|"reservado"|"vendido"|"alquilado";is_featured:boolean;
  city:string|null;province:string|null;published_at:string|null;created_at:string};

export type PropertyRow=ListingBase&{title:string;property_type:string;operation_type:"venta"|"alquiler";city:string;sector:string|null;
  land_area_m2:Num|null;built_area_m2:Num|null;bedrooms:number|null;bathrooms:Num|null;parking_spots:number|null};

export type VehicleRow=ListingBase&{brand:string;model:string;year:number;condition:"nuevo"|"usado";mileage_km:number|null;fuel:string|null;transmission:string|null;engine:string|null};

type ListingEmbed={properties:{title:string;slug:string}|null;vehicles:{brand:string;model:string;year:number;slug:string}|null};

export type LeadRow=ListingEmbed&{id:string;name:string;phone:string|null;email:string|null;status:string;channel:string;interest_type:string;message:string|null;notes:string|null;
  ref_code:string|null;utm_source:string|null;utm_campaign:string|null;fbclid:string|null;gclid:string|null;created_at:string;
  utm_medium?:string|null;utm_content?:string|null;search_criteria?:Record<string,unknown>|null;consent_at?:string|null};

export type EventRow=ListingEmbed&{id:string;event_id:string;event_name:"Contact"|"Lead";ref_code:string|null;lead_id:string|null;property_id:string|null;vehicle_id:string|null;
  visitor_id:string|null;utm_source:string|null;utm_medium:string|null;utm_campaign:string|null;utm_content:string|null;utm_term:string|null;
  fbclid:string|null;gclid:string|null;fbp:string|null;fbc:string|null;event_source_url:string|null;capi_status:string;capi_last_error:string|null;occurred_at:string};

export type IdRow={id:string};
