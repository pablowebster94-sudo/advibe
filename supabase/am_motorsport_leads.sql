create extension if not exists pgcrypto;
create table if not exists public.am_motorsport_leads (
  id uuid primary key default gen_random_uuid(),
  vehicle text not null,
  vehicle_slug text not null,
  name text not null,
  phone text not null,
  answers jsonb not null default '{}'::jsonb,
  score text not null check (score in ('HOT','WARM','COLD')),
  utm jsonb not null default '{}'::jsonb,
  page text,
  source text not null default 'am-motorsport-drive',
  status text not null default 'new',
  created_at timestamptz not null default now()
);
create index if not exists am_motorsport_leads_vehicle_idx on public.am_motorsport_leads(vehicle_slug);
create index if not exists am_motorsport_leads_score_idx on public.am_motorsport_leads(score);
create index if not exists am_motorsport_leads_created_idx on public.am_motorsport_leads(created_at desc);
alter table public.am_motorsport_leads enable row level security;