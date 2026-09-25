create table if not exists public.workspaces (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 slug text not null unique,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.workspaces enable row level security;
revoke all on public.workspaces from anon, authenticated;
grant select, insert, update, delete on public.workspaces to authenticated;
grant all on public.workspaces to service_role;