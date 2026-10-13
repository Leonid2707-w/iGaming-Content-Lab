-- Telegram bot: per-chat wizard state (serverless functions don't share memory)
-- Run in Supabase SQL Editor

create table if not exists public.telegram_bot_sessions (
  chat_id bigint primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.telegram_bot_sessions enable row level security;

-- Fast lookup of a client's orders created from the bot ("Мои заказы")
create index if not exists orders_meta_telegram_user_idx
  on public.orders ((meta->>'telegram_user_id'));

-- Access only via service role from API server.
