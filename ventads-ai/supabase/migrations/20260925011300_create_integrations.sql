create table if not exists public.integrations (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 provider text not null check(provider in ('meta_ads','tiktok_ads')),
 credentials jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id,provider)
);
alter table public.integrations enable row level security;
revoke all on public.integrations from anon,authenticated;
grant select,insert,update,delete on public.integrations to authenticated;
grant all on public.integrations to service_role;