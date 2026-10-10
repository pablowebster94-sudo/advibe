import {isValidPhone,normalizePhone} from "@/lib/enfoque-meta";

// Captación de demanda: compradores que llegan por una publicación y buscan otra.
// Se guardan como leads interest_type=busco_propiedad con los criterios en search_criteria (jsonb).
// La validación vive aquí (servidor y tests); el formulario solo ofrece las mismas opciones.

export const SEARCH_WHAT=[["casa","Casa"],["terreno","Terreno"],["local","Local"],["departamento","Departamento"],["vehiculo","Vehículo"],["otro","Otro"]] as const;
export const SEARCH_OPERATION=[["comprar","Comprar"],["alquilar","Alquilar"]] as const;
export const SEARCH_CANTON=[["gualaceo","Gualaceo"],["paute","Paute"],["chordeleg","Chordeleg"],["sigsig","Sígsig"],["cuenca","Cuenca"],["azogues","Azogues"],["otro","Otro"]] as const;
export const SEARCH_TIMEFRAME=[["inmediato","Lo antes posible"],["3_meses","En los próximos 3 meses"],["6_meses","En 3 a 6 meses"],["mas_6_meses","En más de 6 meses"],["explorando","Solo estoy mirando"]] as const;

export const CONSENT_TEXT="Acepto que Enfoque Visual (AdVibe Agencia) guarde y use estos datos para contactarme por WhatsApp o correo con opciones que coincidan con mi búsqueda, conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador. Puedo pedir que los eliminen en cualquier momento.";

type Options=ReadonlyArray<readonly [string,string]>;
const pick=(list:Options,v:unknown)=>list.find(([k])=>k===v)?.[0]??null;
export const optionLabel=(list:Options,v:unknown)=>list.find(([k])=>k===v)?.[1]??(v==null?"":String(v));

const clean=(v:unknown,max:number)=>typeof v==="string"?v.trim().replace(/\s+/g," ").slice(0,max):"";

export type SearchCriteria={what:string;operation:string;canton:string;canton_other:string|null;budget_max:number|null;
  from_abroad:boolean;country:string|null;timeframe:string|null;notes:string|null};

export type BuscoResult=
  |{ok:true;name:string;phone:string;email:string|null;criteria:SearchCriteria}
  |{ok:false;error:string};

const fail=(error:string):BuscoResult=>({ok:false,error});

/**
 * Valida el formulario "Busco propiedad". Obligatorios: qué busca, operación, cantón, nombre,
 * WhatsApp en E.164 válido y la casilla de consentimiento (LOPDP). Presupuesto opcional ≥ 0.
 */
export function parseBuscoPropiedad(body:Record<string,unknown>):BuscoResult{
  const what=pick(SEARCH_WHAT,body.what),operation=pick(SEARCH_OPERATION,body.operation),canton=pick(SEARCH_CANTON,body.canton);
  if(!what)return fail("Elige qué estás buscando.");
  if(!operation)return fail("Elige si quieres comprar o alquilar.");
  if(!canton)return fail("Elige el cantón.");
  let budget:number|null=null;
  const rawBudget=body.budget_max;
  if(rawBudget!==undefined&&rawBudget!==null&&rawBudget!==""){
    const n=typeof rawBudget==="number"?rawBudget:Number(String(rawBudget).replace(/[\s,$]/g,""));
    if(!Number.isFinite(n)||n<0)return fail("El presupuesto debe ser un número mayor o igual a 0.");
    if(n>100_000_000)return fail("Revisa el presupuesto.");
    budget=Math.round(n);
  }
  const abroad=body.from_abroad===true||body.from_abroad==="true"||body.from_abroad==="si";
  const country=clean(body.country,80);
  if(abroad&&country.length<2)return fail("Indica desde qué país compras.");
  const timeframe=pick(SEARCH_TIMEFRAME,body.timeframe);
  const name=clean(body.name,120);
  if(name.length<2)return fail("Escribe tu nombre.");
  const phone=normalizePhone(String(body.phone||""));
  if(!phone)return fail("Déjanos tu WhatsApp para avisarte.");
  if(!isValidPhone(phone))return fail("Revisa el WhatsApp: con código de país si estás fuera de Ecuador (ej. +1 555 123 4567) o 09XXXXXXXX.");
  const email=clean(body.email,254).toLowerCase();
  if(email&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))return fail("Revisa el correo electrónico.");
  if(body.consent!==true)return fail("Para avisarte necesitamos tu autorización para usar tus datos (casilla de consentimiento).");
  const cantonOther=canton==="otro"?clean(body.canton_other,80)||null:null;
  return {ok:true,name,phone,email:email||null,criteria:{
    what,operation,canton,canton_other:cantonOther,budget_max:budget,from_abroad:abroad,country:abroad?country:null,timeframe,
    notes:clean(body.notes,1000)||null
  }};
}

/** Criterios legibles (panel, aviso y mensaje del lead). */
export function describeCriteria(c:Partial<SearchCriteria>|null|undefined){
  if(!c)return "";
  return [
    optionLabel(SEARCH_WHAT,c.what),
    c.operation?optionLabel(SEARCH_OPERATION,c.operation).toLowerCase():"",
    c.canton==="otro"?c.canton_other||"otro cantón":optionLabel(SEARCH_CANTON,c.canton),
    typeof c.budget_max==="number"?`hasta USD ${c.budget_max.toLocaleString("en-US")}`:"",
    c.from_abroad?`compra desde ${c.country||"el exterior"}`:"",
    c.timeframe?optionLabel(SEARCH_TIMEFRAME,c.timeframe).toLowerCase():""
  ].filter(Boolean).join(" · ");
}

/** Versión para el webhook (etiquetas legibles en vez de claves). */
export function criteriaForNotice(c:SearchCriteria){
  return {what:optionLabel(SEARCH_WHAT,c.what),operation:optionLabel(SEARCH_OPERATION,c.operation).toLowerCase(),
    canton:c.canton==="otro"?c.canton_other||"Otro":optionLabel(SEARCH_CANTON,c.canton),budget_max:c.budget_max,
    from_abroad:c.from_abroad,country:c.country,timeframe:c.timeframe?optionLabel(SEARCH_TIMEFRAME,c.timeframe):null,notes:c.notes};
}
