do $$ begin create type public.workspace_role as enum ('owner','editor','viewer'); exception when duplicate_object then null; end $$;
create table if not exists public.workspace_members (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.workspace_role not null default 'viewer',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(workspace_id,user_id)
);
create index if not exists workspace_members_user_id_idx on public.workspace_members(user_id);
alter table public.workspace_members enable row level security;
revoke all on public.workspace_members from anon, authenticated;
grant select,insert,update,delete on public.workspace_members to authenticated;
grant all on public.workspace_members to service_role;