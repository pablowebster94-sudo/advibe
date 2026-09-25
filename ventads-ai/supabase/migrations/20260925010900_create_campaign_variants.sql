create table if not exists public.campaign_variants (
 id uuid primary key default gen_random_uuid(),
 campaign_id uuid not null references public.campaigns(id) on delete cascade,
 platform_id uuid not null references public.platforms(id) on delete restrict,
 image_asset_id uuid references public.assets(id) on delete set null,
 status text not null default 'draft',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(campaign_id,platform_id),
 check(status in ('draft','approved','exported'))
);
create index if not exists campaign_variants_campaign_id_idx on public.campaign_variants(campaign_id);
alter table public.campaign_variants enable row level security;
revoke all on public.campaign_variants from anon,authenticated;
grant select,insert,update,delete on public.campaign_variants to authenticated;
grant all on public.campaign_variants to service_role;