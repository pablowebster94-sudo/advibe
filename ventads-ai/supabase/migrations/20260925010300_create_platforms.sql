create table if not exists public.platforms (
 id uuid primary key default gen_random_uuid(),
 key text not null unique,
 channel text not null,
 format text not null,
 aspect_ratio text not null,
 max_headline_chars integer not null check(max_headline_chars>0),
 max_primary_text_chars integer,
 max_hashtags integer,
 capabilities jsonb not null default '{}'::jsonb,
 active boolean not null default true,
 sort_order integer not null default 0
);
create index if not exists platforms_active_sort_idx on public.platforms(active,sort_order);
alter table public.platforms enable row level security;
revoke all on public.platforms from anon,authenticated;
grant select on public.platforms to authenticated;
grant all on public.platforms to service_role;