-- Transactional order create / status update with history
-- Run after 001–005 in Supabase SQL Editor

create index if not exists order_status_history_order_id_created_at_idx
  on public.order_status_history (order_id, created_at desc);

create or replace function public.create_order_with_history(
  p_public_id text,
  p_user_id uuid,
  p_client_telegram text,
  p_service_id text,
  p_service_title text,
  p_platform text,
  p_quantity_label text,
  p_price numeric,
  p_price_label text,
  p_description text,
  p_references_text text,
  p_links jsonb,
  p_files jsonb,
  p_meta jsonb
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if p_public_id is null or length(trim(p_public_id)) = 0 then
    raise exception 'public_id required';
  end if;
  if p_client_telegram is null or length(trim(p_client_telegram)) = 0 then
    raise exception 'client_telegram required';
  end if;
  if p_service_title is null or length(trim(p_service_title)) = 0 then
    raise exception 'service_title required';
  end if;

  insert into public.orders (
    public_id,
    user_id,
    client_telegram,
    service_id,
    service_title,
    platform,
    quantity_label,
    price,
    price_label,
    description,
    references_text,
    links,
    files,
    meta,
    status
  )
  values (
    p_public_id,
    p_user_id,
    trim(p_client_telegram),
    p_service_id,
    trim(p_service_title),
    p_platform,
    p_quantity_label,
    p_price,
    p_price_label,
    coalesce(p_description, ''),
    coalesce(p_references_text, ''),
    coalesce(p_links, '[]'::jsonb),
    coalesce(p_files, '[]'::jsonb),
    coalesce(p_meta, '{}'::jsonb),
    'new'
  )
  returning * into v_order;

  insert into public.order_status_history (order_id, status, note)
  values (v_order.id, 'new', 'Заявка создана');

  return v_order;
end;
$$;

create or replace function public.update_order_status_with_history(
  p_order_id uuid,
  p_status text,
  p_note text default ''
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
begin
  if p_status not in ('new', 'in_progress', 'done', 'cancelled') then
    raise exception 'invalid status';
  end if;

  update public.orders
  set status = p_status, updated_at = now()
  where id = p_order_id
  returning * into v_order;

  if v_order.id is null then
    raise exception 'order not found';
  end if;

  insert into public.order_status_history (order_id, status, note)
  values (
    p_order_id,
    p_status,
    case
      when coalesce(trim(p_note), '') = '' then 'Статус изменён на «' || p_status || '»'
      else trim(p_note)
    end
  );

  return v_order;
end;
$$;

revoke all on function public.create_order_with_history(
  text, uuid, text, text, text, text, text, numeric, text, text, text, jsonb, jsonb, jsonb
) from public;
revoke all on function public.update_order_status_with_history(uuid, text, text) from public;

grant execute on function public.create_order_with_history(
  text, uuid, text, text, text, text, text, numeric, text, text, text, jsonb, jsonb, jsonb
) to service_role;
grant execute on function public.update_order_status_with_history(uuid, text, text) to service_role;
