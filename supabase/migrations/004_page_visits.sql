-- Page visits for admin analytics
-- Run in Supabase SQL Editor

create table if not exists public.page_visits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor_id text not null,
  path text not null default '/',
  referrer text not null default '',
  user_agent text not null default ''
);

create index if not exists page_visits_created_at_idx on public.page_visits (created_at desc);
create index if not exists page_visits_visitor_id_idx on public.page_visits (visitor_id);
create index if not exists page_visits_path_idx on public.page_visits (path);
create index if not exists page_visits_day_visitor_idx on public.page_visits (created_at, visitor_id);

alter table public.page_visits enable row level security;

-- No public policies: inserts/reads only via service role from API server.
