-- Fix orders RLS: allow authenticated users to insert/select own rows.
-- Service role still bypasses RLS; these policies cover user-scoped clients.

-- ─── Orders INSERT / UPDATE ─────────────────────────────────────────────────

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "orders_insert_own" on public.orders;
create policy "orders_insert_own"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "orders_update_own" on public.orders;
create policy "orders_update_own"
  on public.orders for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Order history ──────────────────────────────────────────────────────────

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

drop policy if exists "order_history_insert_own" on public.order_status_history;
create policy "order_history_insert_own"
  on public.order_status_history for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

-- ─── Profiles: allow insert of own row (registration fallback) ──────────────

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "consents_insert_own" on public.user_consents;
create policy "consents_insert_own"
  on public.user_consents for insert
  to authenticated
  with check (auth.uid() = user_id);
