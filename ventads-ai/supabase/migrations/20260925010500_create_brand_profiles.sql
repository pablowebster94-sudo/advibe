create table if not exists public.brand_profiles (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 name text not null,
 logo_asset_id uuid references public.assets(id) on delete set null,
 colors jsonb not null default '{}'::jsonb,
 tone text,
 default_cta text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists brand_profiles_workspace_id_idx on public.brand_profiles(workspace_id);
alter table public.brand_profiles enable row level security;
revoke all on public.brand_profiles from anon,authenticated;
grant select,insert,update,delete on public.brand_profiles to authenticated;
grant all on public.brand_profiles to service_role;