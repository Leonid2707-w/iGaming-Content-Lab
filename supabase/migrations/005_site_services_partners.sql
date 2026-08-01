-- Site catalog + partner leads
-- Run in Supabase SQL Editor

create table if not exists public.site_services (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  telegram text not null,
  audience text not null default '',
  comment text not null default '',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'closed')),
  meta jsonb not null default '{}'::jsonb
);

create index if not exists partner_leads_created_at_idx on public.partner_leads (created_at desc);

alter table public.site_services enable row level security;
alter table public.partner_leads enable row level security;

-- Access only via service role from API server.
