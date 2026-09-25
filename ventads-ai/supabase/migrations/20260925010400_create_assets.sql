create table if not exists public.assets (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 type_id uuid not null references public.asset_types(id) on delete restrict,
 storage_path text not null unique,
 mime_type text not null,
 original_filename text,
 size_bytes bigint,
 width integer,
 height integer,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists assets_workspace_id_idx on public.assets(workspace_id);
create index if not exists assets_type_id_idx on public.assets(type_id);
alter table public.assets enable row level security;
revoke all on public.assets from anon,authenticated;
grant select,insert,update,delete on public.assets to authenticated;
grant all on public.assets to service_role;