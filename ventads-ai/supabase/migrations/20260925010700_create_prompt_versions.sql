create table if not exists public.prompt_versions (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 version integer not null,
 provider text not null,
 stage text not null,
 prompt_template text not null,
 is_active boolean not null default false,
 metadata jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(name,version),
 check(stage in ('vision','creative_engine','generation','image'))
);
create index if not exists prompt_versions_stage_active_idx on public.prompt_versions(stage,is_active);
create unique index if not exists prompt_versions_one_active_idx on public.prompt_versions(name,stage) where is_active=true;
alter table public.prompt_versions enable row level security;
revoke all on public.prompt_versions from anon,authenticated;
grant select on public.prompt_versions to authenticated;
grant all on public.prompt_versions to service_role;