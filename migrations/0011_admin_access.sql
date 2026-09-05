-- 0011_admin_access.sql
-- Phase 0 (Admin App prep) — grants + RLS so the single admin (profiles.is_admin = true)
-- can manage catalog, read customer data tied to orders, and advance order status.
-- Customers keep EXACTLY the access they had before (policies are permissive-OR;
-- adding admin policies never widens customer access).
--
-- Run AFTER 0001–0010. Idempotent: safe to re-run.

-- ============================================================================
-- 1) is_admin() — SECURITY DEFINER helper.
--    Policies on profiles must not SELECT profiles directly (RLS recursion),
--    so this function runs as its owner (postgres) and bypasses RLS safely.
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  )
$$;

comment on function public.is_admin() is
  'True when the caller is the single admin (profiles.is_admin). SECURITY DEFINER to avoid RLS recursion on profiles.';

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ============================================================================
-- 2) Table-level grants for admin write paths.
--    Grants go to the authenticated role; the policies below restrict the rows
--    to admins only. (Grant is necessary but not sufficient — RLS still rules.)
-- ============================================================================

grant insert, update, delete on public.categories to authenticated;
grant insert, update, delete on public.styles to authenticated;
grant insert, update, delete on public.patterns to authenticated;
grant insert, update, delete on public.materials to authenticated;
grant insert, update, delete on public.products to authenticated;
grant insert, update, delete on public.product_images to authenticated;

-- Admin may advance order status — and ONLY the status column.
grant update (status) on public.orders to authenticated;

-- Admin writes one history row per status change.
grant insert on public.order_status_history to authenticated;

-- ============================================================================
-- 3) Admin policies — catalog full management.
-- ============================================================================

drop policy if exists categories_admin_all on public.categories;
create policy categories_admin_all on public.categories for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists styles_admin_all on public.styles;
create policy styles_admin_all on public.styles for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists patterns_admin_all on public.patterns;
create policy patterns_admin_all on public.patterns for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists materials_admin_all on public.materials;
create policy materials_admin_all on public.materials for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Products: admin sees/manages ALL rows including is_active = false
-- (public products_public_read still filters is_active for everyone else).
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists product_images_admin_all on public.product_images;
create policy product_images_admin_all on public.product_images for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- 4) Admin policies — read customer profiles (shipping details on orders).
--    Read-only: the admin still cannot edit another user's profile
--    (grant for UPDATE stays column-restricted and own-row-only).
-- ============================================================================

drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles for select to authenticated
using (public.is_admin());

-- ============================================================================
-- 5) Admin policies — orders: read ALL, update STATUS ONLY.
--    UPDATE grant is column-level (status), so even a malicious admin-session
--    payload cannot rewrite shipping snapshots or amounts via the API.
-- ============================================================================

drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders for select to authenticated
using (public.is_admin());

drop policy if exists orders_admin_update_status on public.orders;
create policy orders_admin_update_status on public.orders for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_admin_read on public.order_items;
create policy order_items_admin_read on public.order_items for select to authenticated
using (public.is_admin());

-- ============================================================================
-- 6) Admin policies — order_status_history: read ALL + append.
--    (No update/delete grant: history stays append-only even for the admin.)
-- ============================================================================

drop policy if exists order_status_history_admin_read on public.order_status_history;
create policy order_status_history_admin_read on public.order_status_history for select to authenticated
using (public.is_admin());

drop policy if exists order_status_history_admin_insert on public.order_status_history;
create policy order_status_history_admin_insert on public.order_status_history for insert to authenticated
with check (public.is_admin());

-- ============================================================================
-- 7) Order status flow gains 'cancelled' (admin app Phase 10 transition table:
--    pending → confirmed | cancelled; confirmed → processing | cancelled;
--    processing → shipped; shipped → delivered; delivered/cancelled = terminal).
--    Both check constraints are rebuilt idempotently.
-- ============================================================================

alter table public.orders drop constraint if exists orders_status_allowed;
alter table public.orders add constraint orders_status_allowed
  check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

alter table public.order_status_history drop constraint if exists order_status_history_status_allowed;
alter table public.order_status_history add constraint order_status_history_status_allowed
  check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));
