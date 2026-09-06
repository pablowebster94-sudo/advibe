create extension if not exists pgcrypto;

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  request text not null,
  brief jsonb not null,
  art_prompt text not null,
  format text not null,
  status text not null default 'generated',
  qc jsonb,
  created_at timestamptz not null default now()
);

create index if not exists generations_created_at_idx on public.generations(created_at desc);
create index if not exists generations_client_name_idx on public.generations(client_name);

alter table public.generations enable row level security;

-- La escritura se realiza desde el servidor con SUPABASE_SERVICE_ROLE_KEY.
-- Para un dashboard autenticado, añadir políticas RLS específicas antes de exponer SELECT al cliente.
