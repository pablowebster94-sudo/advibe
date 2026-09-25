create table if not exists public.generation_jobs (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 campaign_id uuid references public.campaigns(id) on delete set null,
 status text not null default 'queued',
 retry_count integer not null default 0 check(retry_count>=0),
 started_at timestamptz,
 finished_at timestamptz,
 error_message text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check(status in ('queued','running','succeeded','failed')),
 check(finished_at is null or started_at is null or finished_at>=started_at)
);
create index if not exists generation_jobs_workspace_id_idx on public.generation_jobs(workspace_id);
create index if not exists generation_jobs_status_idx on public.generation_jobs(status);
alter table public.generation_jobs enable row level security;
revoke all on public.generation_jobs from anon,authenticated;
grant select,insert,update,delete on public.generation_jobs to authenticated;
grant all on public.generation_jobs to service_role;