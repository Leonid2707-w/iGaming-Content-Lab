-- Multi-admin RBAC for iCL admin panel
-- Run after 001–006. Owner account is seeded by the API from ADMIN_PASSWORD (hashed).

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  login text not null,
  password_hash text not null,
  display_name text not null default '',
  is_owner boolean not null default false,
  is_active boolean not null default true,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_users_login_nonempty check (length(trim(login)) >= 2)
);

create unique index if not exists admin_users_login_lower_uidx
  on public.admin_users (lower(login));

create unique index if not exists admin_users_single_owner_uidx
  on public.admin_users (is_owner)
  where is_owner = true;

create index if not exists admin_users_active_idx
  on public.admin_users (is_active);

alter table public.admin_users enable row level security;

-- No public policies: access only via service role from API.
