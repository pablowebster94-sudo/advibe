-- =====================================================================
-- Enfoque Visual · AdVibe Agencia
-- Migración 0001 · Esquema inicial (Supabase / PostgreSQL 15+)
--
-- Convenciones:
--   · Tablas y columnas en inglés (código).
--   · Valores de enums de dominio en español, snake_case, sin tildes
--     (coinciden con lo que ve el negocio: 'casa', 'venta', 'nuevo'...).
--   · Escrituras públicas (leads, eventos) SOLO desde el servidor con
--     service_role. El rol anon nunca escribe.
--
-- Antes de ejecutar:
--   · Auth > Providers > Email: DESACTIVAR "Allow new users to sign up".
--     Los usuarios del panel se crean a mano (ver sección 9).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. ENUMS
-- ---------------------------------------------------------------------
create type public.property_type       as enum ('casa','departamento','terreno','oficina','local','bodega','quinta','otro');
create type public.operation_type      as enum ('venta','alquiler');
create type public.publication_status  as enum ('borrador','publicado','archivado');
create type public.availability_status as enum ('disponible','reservado','vendido','alquilado');
create type public.fuel_type           as enum ('gasolina','diesel','hibrido','electrico','gas','otro');
create type public.transmission_type   as enum ('manual','automatica','otra');
create type public.vehicle_condition   as enum ('nuevo','usado');
create type public.owner_kind          as enum ('propio','particular','inmobiliaria','concesionario','empresa');
create type public.user_role           as enum ('admin','editor');
create type public.interest_type       as enum ('publicar_propiedad','publicar_vehiculo','comprar_propiedad','alquilar_propiedad','comprar_vehiculo','informacion_general');
create type public.lead_channel        as enum ('formulario','whatsapp','llamada','otro');
create type public.lead_status         as enum ('nuevo','contactado','calificado','visita_agendada','negociacion','cerrado','descartado');

-- ---------------------------------------------------------------------
-- 2. DOMINIOS (validación reutilizable; NULL siempre pasa)
-- ---------------------------------------------------------------------
create domain public.tracking_text as text check (char_length(value) <= 255);
create domain public.currency_code as text check (value ~ '^[A-Z]{3}$');
create domain public.e164_phone    as text check (value ~ '^\+[1-9][0-9]{7,14}$');
create domain public.url_https     as text check (value ~ '^https://' and char_length(value) <= 2048);

-- ---------------------------------------------------------------------
-- 3. FUNCIONES AUXILIARES DE TRIGGER
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.set_published_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.publication_status = 'publicado' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- 4. TABLAS DE ORGANIZACIÓN
-- ---------------------------------------------------------------------

-- Personal con acceso al panel. Se vincula a auth.users.
-- NO se crea automáticamente al registrarse: si hay fila aquí, es staff.
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       public.user_role not null,
  created_at timestamptz not null default now()
);

-- Dueño del inmueble/vehículo: cliente, inmobiliaria, concesionario, o "propio".
-- Datos privados: solo staff.
create table public.owners (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 2 and 160),
  kind       public.owner_kind not null default 'particular',
  phone      public.e164_phone,
  email      text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  notes      text,
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Responsable de contacto (quien atiende al interesado). Datos públicos-seguros.
-- whatsapp_number es opcional: si es NULL se usa NEXT_PUBLIC_WHATSAPP_NUMBER.
create table public.agents (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references public.profiles(id) on delete set null,
  name            text not null check (char_length(name) between 2 and 120),
  whatsapp_number public.e164_phone,
  photo_path      text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. CATÁLOGO: PROPIEDADES Y VEHÍCULOS
-- ---------------------------------------------------------------------
create table public.properties (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null,
  title                text not null check (char_length(title) between 5 and 160),
  description          text,
  -- Convención: en alquiler, price = canon MENSUAL.
  price                numeric(14,2) not null check (price >= 0),
  currency             public.currency_code not null default 'USD',
  property_type        public.property_type  not null,
  operation_type       public.operation_type not null,
  city                 text not null,
  province             text not null,
  sector               text,
  address_line         text,                       -- privado de facto: no mostrar si show_exact_location = false
  show_exact_location  boolean not null default false,
  latitude             numeric(9,6) check (latitude  between -90  and 90),
  longitude            numeric(9,6) check (longitude between -180 and 180),
  land_area_m2         numeric(10,2) check (land_area_m2  >= 0),
  built_area_m2        numeric(10,2) check (built_area_m2 >= 0),
  bedrooms             smallint check (bedrooms >= 0),
  bathrooms            numeric(3,1) check (bathrooms >= 0),   -- admite 2.5 (medio baño)
  parking_spots        smallint check (parking_spots >= 0),
  features             text[] not null default '{}',
  video_url            public.url_https,
  cover_path           text,                       -- denormalizado; lo mantiene un trigger desde listing_images
  owner_id             uuid not null references public.owners(id) on delete restrict,
  agent_id             uuid references public.agents(id) on delete set null,
  publication_status   public.publication_status  not null default 'borrador',
  availability         public.availability_status not null default 'disponible',
  is_featured          boolean not null default false,
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  search_tsv           tsvector generated always as (
    to_tsvector('spanish'::regconfig,
      coalesce(title,'') || ' ' || coalesce(city,'') || ' ' ||
      coalesce(sector,'') || ' ' || coalesce(description,''))
  ) stored,
  constraint properties_slug_key    unique (slug),
  constraint properties_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  constraint properties_latlng_pair check ((latitude is null) = (longitude is null))
);

create table public.vehicles (
  id                   uuid primary key default gen_random_uuid(),
  slug                 text not null,
  brand                text not null,
  model                text not null,
  trim                 text,                       -- "Versión"
  year                 smallint not null check (year between 1950 and 2100),
  price                numeric(14,2) not null check (price >= 0),
  currency             public.currency_code not null default 'USD',
  condition            public.vehicle_condition not null default 'usado',
  mileage_km           integer check (mileage_km >= 0),
  fuel                 public.fuel_type,
  transmission         public.transmission_type,
  engine               text,                       -- "Motor" (descriptivo, ej. 2.0 turbo)
  displacement_cc      integer check (displacement_cc > 0),
  description          text,
  city                 text,
  province             text,
  features             text[] not null default '{}',
  video_url            public.url_https,
  cover_path           text,
  owner_id             uuid not null references public.owners(id) on delete restrict,
  agent_id             uuid references public.agents(id) on delete set null,
  publication_status   public.publication_status  not null default 'borrador',
  availability         public.availability_status not null default 'disponible',
  is_featured          boolean not null default false,
  published_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  search_tsv           tsvector generated always as (
    to_tsvector('spanish'::regconfig,
      coalesce(brand,'') || ' ' || coalesce(model,'') || ' ' ||
      coalesce(trim,'')  || ' ' || coalesce(description,''))
  ) stored,
  constraint vehicles_slug_key    unique (slug),
  constraint vehicles_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120)
);

-- Imágenes: una tabla con dos FKs reales (sin polimorfismo) y CHECK de "exactamente un padre".
-- Los videos NO se suben a Storage: se referencian por video_url (YouTube/Vimeo/etc.).
create table public.listing_images (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid references public.properties(id) on delete cascade,
  vehicle_id   uuid references public.vehicles(id)   on delete cascade,
  storage_path text not null check (storage_path ~ '^(properties|vehicles)/'),
  alt_text     text,
  width        integer check (width  > 0),
  height       integer check (height > 0),
  sort_order   integer not null default 0,
  is_cover     boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint listing_images_one_parent check (num_nonnulls(property_id, vehicle_id) = 1)
);

-- ---------------------------------------------------------------------
-- 6. LEADS, HISTORIAL Y EVENTOS DE CONVERSIÓN
-- ---------------------------------------------------------------------
create table public.leads (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null check (char_length(name) between 2 and 120),
  phone                public.e164_phone,
  email                text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  interest_type        public.interest_type not null default 'informacion_general',
  property_id          uuid references public.properties(id) on delete set null,
  vehicle_id           uuid references public.vehicles(id)   on delete set null,
  message              text check (char_length(message) <= 2000),
  channel              public.lead_channel not null default 'formulario',
  ref_code             public.tracking_text,          -- código del mensaje de WhatsApp (ej. EV-7K3Q9)
  visitor_id           uuid,                          -- cookie propia; une eventos anónimos con el lead
  -- Atribución last-touch (la que "acredita" la plataforma de anuncios)
  utm_source           public.tracking_text,
  utm_medium           public.tracking_text,
  utm_campaign         public.tracking_text,
  utm_content          public.tracking_text,
  utm_term             public.tracking_text,
  fbclid               public.tracking_text,
  gclid                public.tracking_text,
  fbp                  public.tracking_text,          -- necesarios para enviar eventos CAPI posteriores
  fbc                  public.tracking_text,
  first_touch          jsonb,                         -- atribución first-touch completa
  landing_url          public.url_https,
  -- Pipeline
  status               public.lead_status not null default 'nuevo',
  assigned_agent_id    uuid references public.agents(id) on delete set null,
  lost_reason          text,
  deal_value           numeric(14,2) check (deal_value >= 0),
  deal_currency        public.currency_code default 'USD',
  notes                text,
  privacy_accepted_at  timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint leads_contact_required check (phone is not null or email is not null),
  constraint leads_single_listing   check (num_nonnulls(property_id, vehicle_id) <= 1)
);

-- Cada cambio de estado queda registrado: base del embudo y de eventos offline hacia Meta.
create table public.lead_status_history (
  id          bigint generated always as identity primary key,
  lead_id     uuid not null references public.leads(id) on delete cascade,
  from_status public.lead_status,
  to_status   public.lead_status not null,
  changed_by  uuid references auth.users(id) on delete set null,
  note        text,
  changed_at  timestamptz not null default now()
);

-- Solo eventos de alto valor (Contact = clic a WhatsApp, Lead = formulario).
-- PageView y ViewContent NO se guardan aquí: viven en Pixel/CAPI/GA4.
create table public.conversion_events (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null,                     -- mismo ID que el Pixel: deduplicación con CAPI
  event_name        text not null check (event_name in ('Contact','Lead')),
  visitor_id        uuid,
  ref_code          public.tracking_text,
  property_id       uuid references public.properties(id) on delete set null,
  vehicle_id        uuid references public.vehicles(id)   on delete set null,
  lead_id           uuid references public.leads(id)      on delete set null,
  cta_source        public.tracking_text,              -- dónde se hizo clic: 'sticky_mobile', 'ficha', 'card', 'form'...
  value             numeric(14,2),
  currency          public.currency_code,
  city              text,
  utm_source        public.tracking_text,
  utm_medium        public.tracking_text,
  utm_campaign      public.tracking_text,
  utm_content       public.tracking_text,
  utm_term          public.tracking_text,
  fbclid            public.tracking_text,
  gclid             public.tracking_text,
  fbp               public.tracking_text,
  fbc               public.tracking_text,
  event_source_url  public.url_https,
  capi_status       text not null default 'pendiente'
                    check (capi_status in ('pendiente','enviado','fallido','omitido')),
  capi_attempts     smallint not null default 0,
  capi_last_error   text,
  capi_sent_at      timestamptz,
  occurred_at       timestamptz not null default now(),
  constraint conversion_events_event_id_key unique (event_id),
  constraint conversion_events_single_listing check (num_nonnulls(property_id, vehicle_id) <= 1)
);

-- ---------------------------------------------------------------------
-- 7. ÍNDICES
-- ---------------------------------------------------------------------
-- Propiedades (índices parciales: solo lo publicado, que es lo que consulta el público)
create index properties_listing_idx     on public.properties (operation_type, property_type, city, price)
  where publication_status = 'publicado';
create index properties_recent_idx      on public.properties (published_at desc)
  where publication_status = 'publicado';
create index properties_featured_idx    on public.properties (published_at desc)
  where publication_status = 'publicado' and is_featured;
create index properties_rooms_idx       on public.properties (bedrooms, bathrooms)
  where publication_status = 'publicado';
create index properties_features_gin    on public.properties using gin (features);
create index properties_search_gin      on public.properties using gin (search_tsv);
create index properties_owner_idx       on public.properties (owner_id);
create index properties_agent_idx       on public.properties (agent_id);

-- Vehículos
create index vehicles_listing_idx       on public.vehicles (brand, model, year, price)
  where publication_status = 'publicado';
create index vehicles_recent_idx        on public.vehicles (published_at desc)
  where publication_status = 'publicado';
create index vehicles_featured_idx      on public.vehicles (published_at desc)
  where publication_status = 'publicado' and is_featured;
create index vehicles_fuel_trans_idx    on public.vehicles (fuel, transmission)
  where publication_status = 'publicado';
create index vehicles_features_gin      on public.vehicles using gin (features);
create index vehicles_search_gin        on public.vehicles using gin (search_tsv);
create index vehicles_owner_idx         on public.vehicles (owner_id);
create index vehicles_agent_idx         on public.vehicles (agent_id);

-- Imágenes
create index listing_images_property_idx on public.listing_images (property_id, sort_order) where property_id is not null;
create index listing_images_vehicle_idx  on public.listing_images (vehicle_id,  sort_order) where vehicle_id  is not null;
create unique index listing_images_one_cover_property on public.listing_images (property_id) where is_cover and property_id is not null;
create unique index listing_images_one_cover_vehicle  on public.listing_images (vehicle_id)  where is_cover and vehicle_id  is not null;

-- Leads y eventos
create index leads_status_created_idx   on public.leads (status, created_at desc);
create index leads_property_idx         on public.leads (property_id) where property_id is not null;
create index leads_vehicle_idx          on public.leads (vehicle_id)  where vehicle_id  is not null;
create index leads_campaign_idx         on public.leads (utm_campaign, created_at desc);
create index leads_visitor_idx          on public.leads (visitor_id) where visitor_id is not null;
create index leads_agent_idx            on public.leads (assigned_agent_id);
create unique index leads_ref_code_key  on public.leads (ref_code) where ref_code is not null;

create index lead_history_lead_idx      on public.lead_status_history (lead_id, changed_at);

create index conv_events_occurred_idx   on public.conversion_events (occurred_at desc);
create index conv_events_campaign_idx   on public.conversion_events (utm_campaign, event_name);
create index conv_events_property_idx   on public.conversion_events (property_id) where property_id is not null;
create index conv_events_vehicle_idx    on public.conversion_events (vehicle_id)  where vehicle_id  is not null;
create index conv_events_lead_idx       on public.conversion_events (lead_id)     where lead_id     is not null;
create index conv_events_pending_idx    on public.conversion_events (occurred_at) where capi_status in ('pendiente','fallido');
create unique index conv_events_ref_key on public.conversion_events (ref_code) where ref_code is not null;

-- ---------------------------------------------------------------------
-- 8. TRIGGERS
-- ---------------------------------------------------------------------
create trigger trg_owners_updated     before update on public.owners     for each row execute function public.set_updated_at();
create trigger trg_agents_updated     before update on public.agents     for each row execute function public.set_updated_at();
create trigger trg_properties_updated before update on public.properties for each row execute function public.set_updated_at();
create trigger trg_vehicles_updated   before update on public.vehicles   for each row execute function public.set_updated_at();
create trigger trg_leads_updated      before update on public.leads      for each row execute function public.set_updated_at();

create trigger trg_properties_published before insert or update of publication_status on public.properties
  for each row execute function public.set_published_at();
create trigger trg_vehicles_published   before insert or update of publication_status on public.vehicles
  for each row execute function public.set_published_at();

-- Mantiene properties.cover_path / vehicles.cover_path (portada, o primera imagen si no hay portada).
create or replace function public.sync_listing_cover()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  r      public.listing_images;
  v_path text;
begin
  if tg_op = 'DELETE' then r := old; else r := new; end if;

  if r.property_id is not null then
    select i.storage_path into v_path
      from public.listing_images i
     where i.property_id = r.property_id
     order by i.is_cover desc, i.sort_order, i.created_at
     limit 1;
    update public.properties set cover_path = v_path where id = r.property_id;
  elsif r.vehicle_id is not null then
    select i.storage_path into v_path
      from public.listing_images i
     where i.vehicle_id = r.vehicle_id
     order by i.is_cover desc, i.sort_order, i.created_at
     limit 1;
    update public.vehicles set cover_path = v_path where id = r.vehicle_id;
  end if;
  return null;
end $$;

create trigger trg_listing_images_cover
  after insert or update or delete on public.listing_images
  for each row execute function public.sync_listing_cover();

-- Historial de estados del lead.
create or replace function public.log_lead_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    insert into public.lead_status_history (lead_id, from_status, to_status, changed_by)
    values (new.id, null, new.status, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.lead_status_history (lead_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return null;
end $$;

create trigger trg_leads_status_log
  after insert or update of status on public.leads
  for each row execute function public.log_lead_status();

-- ---------------------------------------------------------------------
-- 9. RLS
--    Regla: deny-by-default. El público (anon) solo LEE catálogo publicado.
--    Leads y eventos se escriben desde el servidor con service_role (bypass RLS).
-- ---------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                  where p.id = (select auth.uid()) and p.role = 'admin');
$$;

alter table public.profiles            enable row level security;
alter table public.owners              enable row level security;
alter table public.agents              enable row level security;
alter table public.properties          enable row level security;
alter table public.vehicles            enable row level security;
alter table public.listing_images      enable row level security;
alter table public.leads               enable row level security;
alter table public.lead_status_history enable row level security;
alter table public.conversion_events   enable row level security;

-- profiles
create policy profiles_select_self on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_admin_all on public.profiles
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- owners: solo staff
create policy owners_staff_all on public.owners
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- agents: lectura pública de activos; gestión staff
create policy agents_public_read on public.agents
  for select to anon, authenticated using (is_active);
create policy agents_staff_all on public.agents
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- properties
create policy properties_public_read on public.properties
  for select to anon, authenticated using (publication_status = 'publicado');
create policy properties_staff_all on public.properties
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- vehicles
create policy vehicles_public_read on public.vehicles
  for select to anon, authenticated using (publication_status = 'publicado');
create policy vehicles_staff_all on public.vehicles
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- listing_images: visibles si su padre está publicado
create policy listing_images_public_read on public.listing_images
  for select to anon, authenticated
  using (
    (property_id is not null and exists (
       select 1 from public.properties p
        where p.id = listing_images.property_id and p.publication_status = 'publicado'))
    or
    (vehicle_id is not null and exists (
       select 1 from public.vehicles v
        where v.id = listing_images.vehicle_id and v.publication_status = 'publicado'))
  );
create policy listing_images_staff_all on public.listing_images
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- leads / historial / eventos: solo staff (inserciones públicas vía service_role en servidor)
create policy leads_staff_all on public.leads
  for all to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

create policy lead_history_staff_read on public.lead_status_history
  for select to authenticated using ((select public.is_staff()));

create policy conv_events_staff_read on public.conversion_events
  for select to authenticated using ((select public.is_staff()));
create policy conv_events_staff_update on public.conversion_events
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));

-- Defensa en profundidad: anon solo puede LEER lo público, aunque una policy se rompa.
-- (Nota: los privilegios por defecto de Supabase vuelven a conceder permisos en tablas
--  NUEVAS; repetir este bloque en cada migración que cree tablas.)
revoke all on all tables in schema public from anon;
grant select on public.properties, public.vehicles, public.listing_images, public.agents to anon;

-- ---------------------------------------------------------------------
-- 10. VISTAS DE EMBUDO  (security_invoker: respetan RLS del usuario que consulta)
-- ---------------------------------------------------------------------
-- campaña → publicación → leads → avance por etapa (basado en historial)
create or replace view public.v_campaign_funnel
with (security_invoker = true) as
select
  coalesce(l.utm_campaign, '(sin campaña)')  as campaign,
  coalesce(l.utm_source,   '(sin fuente)')   as source,
  coalesce(p.slug, v.slug)                   as listing_slug,
  count(distinct l.id)                                                            as leads,
  count(distinct l.id) filter (where h.to_status = 'contactado')                  as contactados,
  count(distinct l.id) filter (where h.to_status = 'calificado')                  as calificados,
  count(distinct l.id) filter (where h.to_status = 'visita_agendada')             as visitas,
  count(distinct l.id) filter (where h.to_status = 'negociacion')                 as negociaciones,
  count(distinct l.id) filter (where h.to_status = 'cerrado')                     as cerrados
from public.leads l
left join public.lead_status_history h on h.lead_id = l.id
left join public.properties p on p.id = l.property_id
left join public.vehicles   v on v.id = l.vehicle_id
group by 1, 2, 3;

-- campaña → publicación → clics a WhatsApp / formularios
create or replace view public.v_campaign_contacts
with (security_invoker = true) as
select
  coalesce(e.utm_campaign, '(sin campaña)')  as campaign,
  coalesce(e.utm_source,   '(sin fuente)')   as source,
  coalesce(p.slug, v.slug)                   as listing_slug,
  count(*) filter (where e.event_name = 'Contact') as clics_whatsapp,
  count(*) filter (where e.event_name = 'Lead')    as formularios
from public.conversion_events e
left join public.properties p on p.id = e.property_id
left join public.vehicles   v on v.id = e.vehicle_id
group by 1, 2, 3;

revoke all on public.v_campaign_funnel, public.v_campaign_contacts from anon;

-- ---------------------------------------------------------------------
-- 11. STORAGE
--    Bucket público SOLO de imágenes. Escritura solo staff.
--    Ruta: properties/{property_id}/{uuid}.webp  |  vehicles/{vehicle_id}/{uuid}.webp
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-media', 'listing-media', true, 8388608,
        array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy listing_media_staff_select on storage.objects
  for select to authenticated
  using (bucket_id = 'listing-media' and (select public.is_staff()));
create policy listing_media_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'listing-media' and (select public.is_staff()));
create policy listing_media_staff_update on storage.objects
  for update to authenticated
  using (bucket_id = 'listing-media' and (select public.is_staff()))
  with check (bucket_id = 'listing-media' and (select public.is_staff()));
create policy listing_media_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-media' and (select public.is_staff()));

-- ---------------------------------------------------------------------
-- 12. PRIMER USUARIO ADMIN (ejecutar A MANO después de crear el usuario en Auth)
-- ---------------------------------------------------------------------
-- insert into public.profiles (id, full_name, role)
-- values ('<TODO: uuid del usuario en auth.users>', '<TODO: nombre>', 'admin');

commit;