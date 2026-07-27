-- iCL Auth: profiles, consents, orders.user_id, RLS
-- Run in Supabase SQL Editor after 001_orders.sql

create extension if not exists "pgcrypto";

-- ─── Profiles ───────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  telegram_username text not null default '',
  company_name text,
  company_role text
    check (
      company_role is null
      or company_role in ('Affiliate', 'Operator', 'Agency', 'Advertiser', 'Other')
    ),
  account_status text not null default 'active'
    check (account_status in ('active', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_user_id_idx on public.profiles (user_id);
create index if not exists profiles_email_idx on public.profiles (email);
create index if not exists profiles_telegram_idx on public.profiles (telegram_username);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

-- ─── Consents ───────────────────────────────────────────────────────────────

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null
    check (consent_type in ('terms', 'privacy_personal_data')),
  accepted_at timestamptz not null default now(),
  unique (user_id, consent_type)
);

create index if not exists user_consents_user_id_idx on public.user_consents (user_id);

-- ─── Orders ↔ users ─────────────────────────────────────────────────────────

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists orders_user_id_idx on public.orders (user_id);

-- ─── Helpers ────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.normalize_telegram(value text)
returns text
language sql
immutable
as $$
  select case
    when value is null or btrim(value) = '' then ''
    when left(btrim(value), 1) = '@' then btrim(value)
    else '@' || btrim(value)
  end;
$$;

-- Auto-create profile + consents from auth.users metadata
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (
    user_id,
    email,
    full_name,
    telegram_username,
    company_name,
    company_role
  ) values (
    new.id,
    coalesce(new.email, ''),
    coalesce(meta->>'full_name', ''),
    public.normalize_telegram(coalesce(meta->>'telegram_username', '')),
    nullif(meta->>'company_name', ''),
    case
      when meta->>'company_role' in ('Affiliate', 'Operator', 'Agency', 'Advertiser', 'Other')
        then meta->>'company_role'
      else null
    end
  )
  on conflict (user_id) do nothing;

  if coalesce((meta->>'consent_terms')::boolean, false) then
    insert into public.user_consents (user_id, consent_type)
    values (new.id, 'terms')
    on conflict (user_id, consent_type) do nothing;
  end if;

  if coalesce((meta->>'consent_privacy')::boolean, false) then
    insert into public.user_consents (user_id, consent_type)
    values (new.id, 'privacy_personal_data')
    on conflict (user_id, consent_type) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep email in sync when auth email changes
create or replace function public.handle_user_email_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = coalesce(new.email, ''),
        updated_at = now()
    where user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.handle_user_email_updated();

-- ─── RLS ────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.user_consents enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "consents_select_own" on public.user_consents;
create policy "consents_select_own"
  on public.user_consents for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can read only their own orders (service role still bypasses RLS)
drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "order_history_select_own" on public.order_status_history;
create policy "order_history_select_own"
  on public.order_status_history for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );
