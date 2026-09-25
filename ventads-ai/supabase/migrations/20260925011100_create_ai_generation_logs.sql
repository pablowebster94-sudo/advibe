create table if not exists public.ai_generation_logs (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 campaign_id uuid references public.campaigns(id) on delete set null,
 generation_job_id uuid references public.generation_jobs(id) on delete set null,
 prompt_version_id uuid references public.prompt_versions(id) on delete set null,
 pipeline_version text,
 stage text not null,
 provider text not null,
 model text not null,
 status text not null,
 latency_ms integer,
 cost_usd numeric(12,6),
 tokens_input integer,
 tokens_output integer,
 request_metadata jsonb not null default '{}'::jsonb,
 response_metadata jsonb not null default '{}'::jsonb,
 error_message text,
 created_at timestamptz not null default now(),
 check(stage in ('vision','creative_engine','generation','image')),
 check(status in ('success','error')),
 check(latency_ms is null or latency_ms>=0),
 check(cost_usd is null or cost_usd>=0),
 check(tokens_input is null or tokens_input>=0),
 check(tokens_output is null or tokens_output>=0)
);
create index if not exists ai_generation_logs_workspace_id_idx on public.ai_generation_logs(workspace_id);
create index if not exists ai_generation_logs_campaign_id_idx on public.ai_generation_logs(campaign_id);
create index if not exists ai_generation_logs_stage_created_idx on public.ai_generation_logs(stage,created_at);
alter table public.ai_generation_logs enable row level security;
revoke all on public.ai_generation_logs from anon,authenticated;
grant select on public.ai_generation_logs to authenticated;
grant all on public.ai_generation_logs to service_role;