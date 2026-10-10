import type {LeadRow} from "@/lib/enfoque-types";
import {describeCriteria,type SearchCriteria} from "@/lib/enfoque-demand";

// Exportación CSV de leads del panel. Separador "," con BOM UTF-8 (Excel abre bien tildes).
// Protección contra inyección de fórmulas: celdas que empiezan por = + - @ (salvo teléfonos/números) llevan '.

export const LEAD_CSV_COLUMNS=["fecha","nombre","whatsapp","correo","interes","publicacion","busqueda","que","operacion","canton","presupuesto_max_usd",
  "desde_exterior","pais","plazo","consentimiento","estado","canal","ref","utm_source","utm_medium","utm_campaign","utm_content","fbclid","gclid","mensaje","notas"] as const;

export function csvCell(value:unknown){
  if(value===null||value===undefined)return "";
  let s=String(value);
  if(/^[=@\t\r]/.test(s)||(/^[+-]/.test(s)&&!/^[+-]?\d[\d\s.]*$/.test(s)))s="'"+s;
  return /[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
}

const listingName=(l:LeadRow)=>l.properties?l.properties.title:l.vehicles?`${l.vehicles.brand} ${l.vehicles.model} ${l.vehicles.year}`:"";

export function leadsToCsv(rows:LeadRow[]){
  const lines=rows.map(l=>{
    const c=(l.search_criteria||null) as Partial<SearchCriteria>|null;
    const values:Record<(typeof LEAD_CSV_COLUMNS)[number],unknown>={
      fecha:l.created_at,nombre:l.name,whatsapp:l.phone,correo:l.email,interes:l.interest_type,publicacion:listingName(l),
      busqueda:describeCriteria(c),que:c?.what,operacion:c?.operation,canton:c?.canton==="otro"?c?.canton_other||"otro":c?.canton,
      presupuesto_max_usd:c?.budget_max,desde_exterior:c?(c.from_abroad?"si":"no"):"",pais:c?.country,plazo:c?.timeframe,consentimiento:l.consent_at,
      estado:l.status,canal:l.channel,ref:l.ref_code,utm_source:l.utm_source,utm_medium:l.utm_medium,utm_campaign:l.utm_campaign,utm_content:l.utm_content,
      fbclid:l.fbclid,gclid:l.gclid,mensaje:l.message,notas:l.notes
    };
    return LEAD_CSV_COLUMNS.map(k=>csvCell(values[k])).join(",");
  });
  return "﻿"+[LEAD_CSV_COLUMNS.join(","),...lines].join("\r\n")+"\r\n";
}
