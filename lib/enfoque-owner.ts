import {supabaseAdmin} from "@/lib/enfoque-supabase";

/** Propietario por defecto de lo que se crea desde el panel. */
export async function defaultOwner(token:string){
  const found=await supabaseAdmin<any[]>("owners?name=eq.AdVibe%20Agencia&kind=eq.propio&limit=1",{},token);
  if(found[0])return found[0].id;
  const rows=await supabaseAdmin<any[]>("owners",{method:"POST",headers:{"Prefer":"return=representation"},body:JSON.stringify({name:"AdVibe Agencia",kind:"propio"})},token);
  return rows[0].id;
}
