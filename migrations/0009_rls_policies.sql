-- 0009_rls_policies.sql
-- Least-privilege grants plus row-level security policies for the customer website.

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.styles enable row level security;
alter table public.patterns enable row level security;
alter table public.materials enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

revoke all privileges on public.profiles from anon, authenticated;
revoke all privileges on public.categories from anon, authenticated;
revoke all privileges on public.styles from anon, authenticated;
revoke all privileges on public.patterns from anon, authenticated;
revoke all privileges on public.materials from anon, authenticated;
revoke all privileges on public.products from anon, authenticated;
revoke all privileges on public.product_images from anon, authenticated;
revoke all privileges on public.cart_items from anon, authenticated;
revoke all privileges on public.orders from anon, authenticated;
revoke all privileges on public.order_items from anon, authenticated;
revoke all privileges on public.order_status_history from anon, authenticated;

grant select on public.categories to anon, authenticated;
grant select on public.styles to anon, authenticated;
grant select on public.patterns to anon, authenticated;
grant select on public.materials to anon, authenticated;
grant select on public.products to anon, authenticated;
grant select on public.product_images to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (name, address, phone) on public.profiles to authenticated;

grant select, insert, update, delete on public.cart_items to authenticated;
grant select, insert on public.orders to authenticated;
grant select, insert on public.order_items to authenticated;
grant select on public.order_status_history to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists styles_public_read on public.styles;
create policy styles_public_read
on public.styles for select
to anon, authenticated
using (true);

drop policy if exists patterns_public_read on public.patterns;
create policy patterns_public_read
on public.patterns for select
to anon, authenticated
using (true);

drop policy if exists materials_public_read on public.materials;
create policy materials_public_read
on public.materials for select
to anon, authenticated
using (true);

drop policy if exists products_public_read on public.products;
create policy products_public_read
on public.products for select
to anon, authenticated
using (is_active = true);

drop policy if exists product_images_public_read on public.product_images;
create policy product_images_public_read
on public.product_images for select
to anon, authenticated
using (true);

drop policy if exists cart_items_own_all on public.cart_items;
create policy cart_items_own_all
on public.cart_items for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists orders_select_own on public.orders;
create policy orders_select_own
on public.orders for select
to authenticated
using (user_id = auth.uid());

drop policy if exists orders_insert_own_pending on public.orders;
create policy orders_insert_own_pending
on public.orders for insert
to authenticated
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists order_items_select_own on public.order_items;
create policy order_items_select_own
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists order_items_insert_own on public.order_items;
create policy order_items_insert_own
on public.order_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders
    where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
  )
);

drop policy if exists order_status_history_select_own on public.order_status_history;
create policy order_status_history_select_own
on public.order_status_history for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    where orders.id = order_status_history.order_id
      and orders.user_id = auth.uid()
  )
);
