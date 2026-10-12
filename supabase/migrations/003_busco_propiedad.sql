-- =====================================================================
-- Enfoque Visual · Migración 003 · Captación de demanda ("Busco propiedad")
--
-- Compradores que buscan otra propiedad o vehículo distinto al de la ficha.
-- Se guardan en leads con interest_type = 'busco_propiedad', los criterios
-- en search_criteria (jsonb, validado en el servidor: lib/enfoque-demand.ts)
-- y el momento del consentimiento LOPDP en consent_at.
--
-- Idempotente: se puede ejecutar más de una vez.
-- =====================================================================

-- Fuera de la transacción: el valor nuevo de un enum no se puede usar en la
-- misma transacción que lo crea, y aquí no se usa.
alter type public.interest_type add value if not exists 'busco_propiedad';

begin;

alter table public.leads
  add column if not exists search_criteria jsonb,
  add column if not exists consent_at      timestamptz;

alter table public.leads drop constraint if exists leads_search_criteria_object;
alter table public.leads add constraint leads_search_criteria_object
  check (search_criteria is null or jsonb_typeof(search_criteria) = 'object');

-- Filtro "Buscadores" del panel y cruces por criterio (qué, cantón…).
create index if not exists leads_search_created_idx on public.leads (created_at desc) where search_criteria is not null;
create index if not exists leads_search_criteria_gin on public.leads using gin (search_criteria jsonb_path_ops) where search_criteria is not null;

commit;
