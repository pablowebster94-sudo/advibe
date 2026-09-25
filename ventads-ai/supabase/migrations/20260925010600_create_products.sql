create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 primary_asset_id uuid not null unique references public.assets(id) on delete restrict,
 name text,
 intelligence_status text not null default 'pending',
 intelligence_json jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(intelligence_status in ('pending','done','failed')),
 check((intelligence_status='done' and intelligence_json is not null) or intelligence_status in ('pending','failed'))
);
create index if not exists products_workspace_id_idx on public.products(workspace_id);
alter table public.products enable row level security;
revoke all on public.products from anon,authenticated;
grant select,insert,update,delete on public.products to authenticated;
grant all on public.products to service_role;