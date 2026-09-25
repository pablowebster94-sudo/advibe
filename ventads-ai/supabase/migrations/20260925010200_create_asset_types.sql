create table if not exists public.asset_types (
 id uuid primary key default gen_random_uuid(),
 key text not null unique,
 display_name text not null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.asset_types enable row level security;
revoke all on public.asset_types from anon,authenticated;
grant select on public.asset_types to authenticated;
grant all on public.asset_types to service_role;