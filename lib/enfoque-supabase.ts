import { Property, Vehicle } from "@/lib/enfoque-data";

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function supabaseAdminConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function baseUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
}

async function rest(path:string, init:RequestInit = {}, token?:string) {
  const url = baseUrl();
  if (!url) throw new Error("Supabase URL is not configured");
  const headers = new Headers(init.headers);
  headers.set("apikey", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "");
  if (token || process.env.SUPABASE_SERVICE_ROLE_KEY) headers.set("Authorization", `Bearer ${token || process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  headers.set("Content-Type","application/json");
  const response = await fetch(`${url}/rest/v1/${path}`, {...init, headers, cache:"no-store"});
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export async function supabasePublic<T>(path:string) {
  return rest(path, {headers:{"Prefer":"return=representation"}}) as Promise<T>;
}

export async function supabaseAdmin<T>(path:string, init:RequestInit = {}) {
  return rest(path, init) as Promise<T>;
}

export async function supabaseAuthPassword(email:string,password:string) {
  const url = baseUrl();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase Auth is not configured");
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method:"POST",
    headers:{"Content-Type":"application/json","apikey":key},
    body:JSON.stringify({email,password}),
    cache:"no-store"
  });
  if (!response.ok) throw new Error("Credenciales inválidas");
  return response.json() as Promise<{access_token:string;refresh_token:string;user:{id:string;email?:string}}>;
}

export async function supabaseUserProfile(accessToken:string) {
  const rows = await rest("profiles?select=id,full_name,role&limit=1", {}, accessToken) as Array<{id:string;full_name:string|null;role:"admin"|"editor"}>;
  return rows[0] || null;
}

function storageUrl(path:string) {
  const url = baseUrl();
  return `${url}/storage/v1/object/public/listing-media/${path}`;
}

export function mapProperty(row:any, images:any[] = []):Property {
  return {
    id:row.id, slug:row.slug, title:row.title, price:Number(row.price), operation:row.operation_type,
    type:row.property_type, city:row.city, sector:row.sector || "", landM2:row.land_area_m2 ? Number(row.land_area_m2) : undefined,
    buildM2:row.built_area_m2 ? Number(row.built_area_m2) : undefined, rooms:row.bedrooms ?? undefined,
    baths:row.bathrooms ? Number(row.bathrooms) : undefined, parking:row.parking_spots ?? undefined,
    description:row.description || "", features:row.features || [], images:images.map(x=>storageUrl(x.storage_path)),
    featured:Boolean(row.is_featured)
  };
}

export function mapVehicle(row:any, images:any[] = []):Vehicle {
  return {
    id:row.id, slug:row.slug, brand:row.brand, model:row.model, year:Number(row.year), price:Number(row.price),
    mileage:Number(row.mileage_km || 0), fuel:row.fuel || "", transmission:row.transmission || "",
    engine:row.engine || "", description:row.description || "", features:row.features || [],
    images:images.map(x=>storageUrl(x.storage_path)), featured:Boolean(row.is_featured)
  };
}

export async function getPublishedProperties() {
  const rows = await supabasePublic<any[]>("properties?publication_status=eq.publicado&order=published_at.desc");
  const images = await supabasePublic<any[]>("listing_images?select=id,property_id,storage_path,sort_order,is_cover&property_id=not.is.null&order=sort_order.asc");
  return rows.map(row=>mapProperty(row,images.filter(i=>i.property_id===row.id)));
}

export async function getPublishedVehicles() {
  const rows = await supabasePublic<any[]>("vehicles?publication_status=eq.publicado&order=published_at.desc");
  const images = await supabasePublic<any[]>("listing_images?select=id,vehicle_id,storage_path,sort_order,is_cover&vehicle_id=not.is.null&order=sort_order.asc");
  return rows.map(row=>mapVehicle(row,images.filter(i=>i.vehicle_id===row.id)));
}

export async function getPublishedProperty(slug:string) {
  const rows = await supabasePublic<any[]>(`properties?slug=eq.${encodeURIComponent(slug)}&publication_status=eq.publicado&limit=1`);
  if (!rows[0]) return undefined;
  const images = await supabasePublic<any[]>(`listing_images?property_id=eq.${rows[0].id}&order=sort_order.asc`);
  return mapProperty(rows[0],images);
}

export async function getPublishedVehicle(slug:string) {
  const rows = await supabasePublic<any[]>(`vehicles?slug=eq.${encodeURIComponent(slug)}&publication_status=eq.publicado&limit=1`);
  if (!rows[0]) return undefined;
  const images = await supabasePublic<any[]>(`listing_images?vehicle_id=eq.${rows[0].id}&order=sort_order.asc`);
  return mapVehicle(rows[0],images);
}
