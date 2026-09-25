create table if not exists public.campaigns (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete restrict,
 brand_profile_id uuid not null references public.brand_profiles(id) on delete restrict,
 name text,
 status text not null default 'draft',
 objective text not null,
 user_context jsonb,
 creative_brief jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(status in ('draft','generating','ready','failed')),
 check(objective in ('awareness','traffic','engagement','leads','sales','app_installs'))
);
create index if not exists campaigns_workspace_id_idx on public.campaigns(workspace_id);
create index if not exists campaigns_product_id_idx on public.campaigns(product_id);
create index if not exists campaigns_status_idx on public.campaigns(status);
create index if not exists campaigns_objective_idx on public.campaigns(objective);
alter table public.campaigns enable row level security;
revoke all on public.campaigns from anon,authenticated;
grant select,insert,update,delete on public.campaigns to authenticated;
grant all on public.campaigns to service_role;