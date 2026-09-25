create table if not exists public.campaign_variant_revisions (
 id uuid primary key default gen_random_uuid(),
 variant_id uuid not null references public.campaign_variants(id) on delete cascade,
 revision_number integer not null check(revision_number>0),
 image_asset_id uuid references public.assets(id) on delete set null,
 ai_generation_log_id uuid references public.ai_generation_logs(id) on delete set null,
 content jsonb not null default '{}'::jsonb,
 source text not null check(source in ('ai_generation','manual_edit')),
 is_current boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(variant_id,revision_number)
);
create index if not exists campaign_variant_revisions_variant_id_idx on public.campaign_variant_revisions(variant_id);
create unique index if not exists campaign_variant_revisions_current_idx on public.campaign_variant_revisions(variant_id) where is_current=true;
alter table public.campaign_variant_revisions enable row level security;
revoke all on public.campaign_variant_revisions from anon,authenticated;
grant select,insert,update,delete on public.campaign_variant_revisions to authenticated;
grant all on public.campaign_variant_revisions to service_role;