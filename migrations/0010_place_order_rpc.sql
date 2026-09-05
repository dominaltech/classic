-- 0010_place_order_rpc.sql
-- Phase 9: atomic order placement.
--
-- One Postgres transaction that:
--   1. verifies the caller owns the order (auth.uid() = p_user_id)
--   2. snapshots shipping details from the profile (must be complete)
--   3. validates every cart row is purchasable (active + within stock)
--   4. snapshots prices into orders + order_items
--   5. logs the initial status_history row ('pending')
--   6. clears the cart — only after everything above succeeded
--
-- Blueprint acceptance rule: an order is ALWAYS fully formed — any failure
-- raises an exception and rolls the whole transaction back, so a partial
-- order can never exist.

create or replace function public.place_order(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $func$
declare
  v_profile record;
  v_order_id uuid;
  v_subtotal numeric(12, 2);
  v_unavailable_names text;

  /* ------------------------------------------------------------------------
     OPTIONAL, STAKEHOLDER-FLAGGED (blueprint Phase 9 item 2):
     Stock decrement at order time. Shipped OFF by default — flip to true
     only after the client confirms the stock policy, then re-run this file.
  ------------------------------------------------------------------------ */
  v_decrement_stock constant boolean := false;
begin
  -- 1. The signed-in customer may only place their own order.
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'ORDER_NOT_AUTHORIZED';
  end if;

  -- 2. Shipping snapshot source: a complete profile.
  select name, address, phone
  into v_profile
  from public.profiles
  where id = p_user_id;

  if v_profile is null
    or btrim(coalesce(v_profile.name, '')) = ''
    or btrim(coalesce(v_profile.address, '')) = ''
    or btrim(coalesce(v_profile.phone, '')) = '' then
    raise exception 'ORDER_PROFILE_INCOMPLETE';
  end if;

  -- 3. Cart must not be empty.
  if not exists (
    select 1 from public.cart_items where user_id = p_user_id
  ) then
    raise exception 'ORDER_CART_EMPTY';
  end if;

  -- 4. Every row must be purchasable at order time.
  select string_agg(p.name, ', ')
  into v_unavailable_names
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = p_user_id
    and (p.is_active is not true or ci.quantity > p.stock_quantity);

  if v_unavailable_names is not null then
    raise exception 'ORDER_ITEMS_UNAVAILABLE: %', v_unavailable_names;
  end if;

  -- 5. Order header with shipping + amount snapshots.
  select coalesce(sum(p.price * ci.quantity), 0)
  into v_subtotal
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = p_user_id;

  insert into public.orders (
    user_id,
    status,
    shipping_name,
    shipping_address,
    shipping_phone,
    subtotal_amount,
    total_amount
  )
  values (
    p_user_id,
    'pending',
    v_profile.name,
    v_profile.address,
    v_profile.phone,
    v_subtotal,
    v_subtotal
  )
  returning id into v_order_id;

  -- 6. Line items with immutable product snapshots.
  insert into public.order_items (
    order_id,
    product_id,
    product_name_snapshot,
    unit_price,
    quantity,
    line_total
  )
  select
    v_order_id,
    p.id,
    p.name,
    p.price,
    ci.quantity,
    p.price * ci.quantity
  from public.cart_items ci
  join public.products p on p.id = ci.product_id
  where ci.user_id = p_user_id;

  -- 7. Initial status-history row (status flow starts at 'pending').
  insert into public.order_status_history (order_id, status, changed_by, note)
  values (v_order_id, 'pending', p_user_id, 'Order placed');

  -- 8. OPTIONAL stock decrement — see v_decrement_stock flag above.
  if v_decrement_stock then
    update public.products p
    set stock_quantity = p.stock_quantity - ci.quantity
    from public.cart_items ci
    where ci.product_id = p.id
      and ci.user_id = p_user_id;
  end if;

  -- 9. Clear the cart only after the full order exists.
  delete from public.cart_items where user_id = p_user_id;

  return v_order_id;
end
$func$;

comment on function public.place_order(uuid) is
  'Atomically creates an order (+items, +status history) from the caller''s cart and clears it. Owner-only via auth.uid().';

-- Only signed-in customers may execute it; the auth.uid() check inside
-- still pins the call to the caller's own data.
revoke all on function public.place_order(uuid) from public, anon, authenticated;
grant execute on function public.place_order(uuid) to authenticated;
