-- iCL Orders schema for Supabase
-- Run in Supabase SQL Editor

create extension if not exists "pgcrypto";

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  public_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_telegram text not null,
  service_id text,
  service_title text not null,
  platform text,
  quantity_label text,
  price numeric,
  price_label text,
  description text not null default '',
  references_text text not null default '',
  links jsonb not null default '[]'::jsonb,
  files jsonb not null default '[]'::jsonb,
  meta jsonb not null default '{}'::jsonb,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'done', 'cancelled')),
  telegram_sent boolean not null default false,
  telegram_error text
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_client_telegram_idx on public.orders (client_telegram);
create index if not exists orders_service_title_idx on public.orders (service_title);
create index if not exists orders_public_id_idx on public.orders (public_id);

alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;

-- No public policies: access only via service role from API server.

insert into storage.buckets (id, name, public)
values ('order-files', 'order-files', false)
on conflict (id) do nothing;
