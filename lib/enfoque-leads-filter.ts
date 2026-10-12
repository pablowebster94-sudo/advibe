// Filtros de la vista de leads del panel (compartidos por la tabla y la exportación CSV).
export const LEAD_STATUSES=["nuevo","contactado","calificado","visita_agendada","negociacion","cerrado","descartado"];

/** Fragmento PostgREST para ?estado=…&tipo=buscadores. Solo valores conocidos (nada del usuario llega a la URL). */
export function leadFilterQuery(estado:string|null|undefined,tipo:string|null|undefined){
  return (estado&&LEAD_STATUSES.includes(estado)?`&status=eq.${estado}`:"")+(tipo==="buscadores"?"&interest_type=eq.busco_propiedad":"");
}
