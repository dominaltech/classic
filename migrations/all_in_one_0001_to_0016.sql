-- ============================================================================
-- ALL-IN-ONE COMPLETE MIGRATION (0001 to 0014)
-- Clothing Material E-Commerce & Admin Platform
-- ============================================================================
-- Run this entire script in the Supabase SQL Editor for your new project.
-- Safe and idempotent (uses IF NOT EXISTS, CREATE OR REPLACE, DROP IF EXISTS).
-- ============================================================================

-- ============================================================================
-- 0001: 0001_create_profiles_table.sql
-- Customer profile storage mapped one-to-one to Supabase Auth users.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  address text not null default '',
  phone text not null default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists name text not null default '';
alter table public.profiles add column if not exists address text not null default '';
alter table public.profiles add column if not exists phone text not null default '';
alter table public.profiles add column if not exists is_admin boolean not null default false;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

comment on table public.profiles is 'One customer-facing profile row per auth user. Customers can edit only name, address, and phone.';
comment on column public.profiles.is_admin is 'Single admin flag for the separate admin app. Customers must never be able to update this column.';

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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from anon, authenticated;


-- ============================================================================
-- 0002: 0002_create_categories_styles_patterns.sql
-- Catalog taxonomy: category, then style, then pattern.
-- ============================================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now()
);

alter table public.categories add column if not exists name text;
alter table public.categories add column if not exists slug text;
alter table public.categories add column if not exists created_at timestamptz not null default now();
create unique index if not exists categories_slug_key on public.categories (slug);
create index if not exists categories_created_at_idx on public.categories (created_at desc);

create table if not exists public.styles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now()
);

alter table public.styles add column if not exists category_id uuid;
alter table public.styles add column if not exists name text;
alter table public.styles add column if not exists slug text;
alter table public.styles add column if not exists created_at timestamptz not null default now();
create unique index if not exists styles_category_slug_key on public.styles (category_id, slug);
create index if not exists styles_category_id_idx on public.styles (category_id);

create table if not exists public.patterns (
  id uuid primary key default gen_random_uuid(),
  style_id uuid not null references public.styles (id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now()
);

alter table public.patterns add column if not exists style_id uuid;
alter table public.patterns add column if not exists name text;
alter table public.patterns add column if not exists slug text;
alter table public.patterns add column if not exists created_at timestamptz not null default now();
create unique index if not exists patterns_style_slug_key on public.patterns (style_id, slug);
create index if not exists patterns_style_id_idx on public.patterns (style_id);


-- ============================================================================
-- 0003: 0003_create_materials_table.sql
-- Reusable material options used by listing filters.
-- ============================================================================

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.materials add column if not exists name text;
alter table public.materials add column if not exists created_at timestamptz not null default now();
create unique index if not exists materials_name_key on public.materials (name);


-- ============================================================================
-- 0004: 0004_create_products_table.sql
-- Sellable catalog products.
-- ============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories (id) on delete restrict,
  style_id uuid not null references public.styles (id) on delete restrict,
  pattern_id uuid references public.patterns (id) on delete set null,
  material_id uuid references public.materials (id) on delete set null,
  name text not null,
  slug text not null,
  description text not null default '',
  price numeric(12, 2) not null default 0,
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products add column if not exists category_id uuid;
alter table public.products add column if not exists style_id uuid;
alter table public.products add column if not exists pattern_id uuid;
alter table public.products add column if not exists material_id uuid;
alter table public.products add column if not exists name text;
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists price numeric(12, 2) not null default 0;
alter table public.products add column if not exists stock_quantity integer not null default 0;
alter table public.products add column if not exists is_active boolean not null default true;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

create unique index if not exists products_slug_key on public.products (slug);
create index if not exists products_active_created_idx on public.products (is_active, created_at desc);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_style_idx on public.products (style_id);
create index if not exists products_pattern_idx on public.products (pattern_id);
create index if not exists products_material_idx on public.products (material_id);
create index if not exists products_price_idx on public.products (price);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_price_non_negative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_price_non_negative check (price >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'products_stock_non_negative'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_stock_non_negative check (stock_quantity >= 0);
  end if;
end $$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();


-- ============================================================================
-- 0005: 0005_create_product_images_table.sql
-- Public product imagery stored in the product-images bucket.
-- ============================================================================

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.product_images add column if not exists product_id uuid;
alter table public.product_images add column if not exists image_url text;
alter table public.product_images add column if not exists alt_text text not null default '';
alter table public.product_images add column if not exists display_order integer not null default 0;
alter table public.product_images add column if not exists created_at timestamptz not null default now();

create index if not exists product_images_product_order_idx on public.product_images (product_id, display_order, created_at);


-- ============================================================================
-- 0006: 0006_create_cart_items_table.sql
-- Customer-owned cart rows. One row per customer and product pair.
-- ============================================================================

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cart_items add column if not exists user_id uuid;
alter table public.cart_items add column if not exists product_id uuid;
alter table public.cart_items add column if not exists quantity integer not null default 1;
alter table public.cart_items add column if not exists created_at timestamptz not null default now();
alter table public.cart_items add column if not exists updated_at timestamptz not null default now();

create unique index if not exists cart_items_user_product_key on public.cart_items (user_id, product_id);
create index if not exists cart_items_product_idx on public.cart_items (product_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'cart_items_quantity_positive'
      and conrelid = 'public.cart_items'::regclass
  ) then
    alter table public.cart_items
      add constraint cart_items_quantity_positive check (quantity > 0);
  end if;
end $$;

drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();


-- ============================================================================
-- 0007: 0007_create_orders_order_items.sql
-- Order header and line items with immutable snapshot fields.
-- ============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  shipping_name text not null,
  shipping_address text not null,
  shipping_phone text not null,
  subtotal_amount numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders add column if not exists user_id uuid;
alter table public.orders add column if not exists status text not null default 'pending';
alter table public.orders add column if not exists shipping_name text;
alter table public.orders add column if not exists shipping_address text;
alter table public.orders add column if not exists shipping_phone text;
alter table public.orders add column if not exists subtotal_amount numeric(12, 2) not null default 0;
alter table public.orders add column if not exists total_amount numeric(12, 2) not null default 0;
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();

create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists orders_status_idx on public.orders (status);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name_snapshot text not null,
  unit_price numeric(12, 2) not null,
  quantity integer not null,
  line_total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

alter table public.order_items add column if not exists order_id uuid;
alter table public.order_items add column if not exists product_id uuid;
alter table public.order_items add column if not exists product_name_snapshot text;
alter table public.order_items add column if not exists unit_price numeric(12, 2);
alter table public.order_items add column if not exists quantity integer;
alter table public.order_items add column if not exists line_total numeric(12, 2);
alter table public.order_items add column if not exists created_at timestamptz not null default now();

create index if not exists order_items_order_idx on public.order_items (order_id);
create index if not exists order_items_product_idx on public.order_items (product_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_status_allowed'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_status_allowed
      check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_amounts_non_negative'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
      add constraint orders_amounts_non_negative
      check (subtotal_amount >= 0 and total_amount >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'order_items_pricing_valid'
      and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
      add constraint order_items_pricing_valid
      check (unit_price >= 0 and quantity > 0 and line_total >= 0);
  end if;
end $$;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();


-- ============================================================================
-- 0008: 0008_create_order_status_history.sql
-- Append-only order status timeline.
-- ============================================================================

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null,
  changed_by uuid references public.profiles (id) on delete set null,
  note text not null default '',
  changed_at timestamptz not null default now()
);

alter table public.order_status_history add column if not exists order_id uuid;
alter table public.order_status_history add column if not exists status text;
alter table public.order_status_history add column if not exists changed_by uuid;
alter table public.order_status_history add column if not exists note text not null default '';
alter table public.order_status_history add column if not exists changed_at timestamptz not null default now();

create index if not exists order_status_history_order_time_idx on public.order_status_history (order_id, changed_at asc, id asc);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'order_status_history_status_allowed'
      and conrelid = 'public.order_status_history'::regclass
  ) then
    alter table public.order_status_history
      add constraint order_status_history_status_allowed
      check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered'));
  end if;
end $$;


-- ============================================================================
-- 0009: 0009_rls_policies.sql
-- Least-privilege grants plus row-level security policies for customer website.
-- ============================================================================

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


-- ============================================================================
-- 0010: 0010_place_order_rpc.sql
-- Phase 9: atomic order placement RPC.
-- ============================================================================

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

  -- 8. OPTIONAL stock decrement.
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

revoke all on function public.place_order(uuid) from public, anon, authenticated;
grant execute on function public.place_order(uuid) to authenticated;


-- ============================================================================
-- 0011: 0011_admin_access.sql
-- Admin App prep — grants + RLS for single admin (profiles.is_admin = true).
-- ============================================================================

-- 1) is_admin() — SECURITY DEFINER helper.
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

-- 2) Table-level grants for admin write paths.
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

-- 3) Admin policies — catalog full management.
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

drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists product_images_admin_all on public.product_images;
create policy product_images_admin_all on public.product_images for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- 4) Admin policies — read customer profiles.
drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles for select to authenticated
using (public.is_admin());

-- 5) Admin policies — orders: read ALL, update STATUS ONLY.
drop policy if exists orders_admin_read on public.orders;
create policy orders_admin_read on public.orders for select to authenticated
using (public.is_admin());

drop policy if exists orders_admin_update_status on public.orders;
create policy orders_admin_update_status on public.orders for update to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists order_items_admin_read on public.order_items;
create policy order_items_admin_read on public.order_items for select to authenticated
using (public.is_admin());

-- 6) Admin policies — order_status_history: read ALL + append.
drop policy if exists order_status_history_admin_read on public.order_status_history;
create policy order_status_history_admin_read on public.order_status_history for select to authenticated
using (public.is_admin());

drop policy if exists order_status_history_admin_insert on public.order_status_history;
create policy order_status_history_admin_insert on public.order_status_history for insert to authenticated
with check (public.is_admin());

-- 7) Order status flow gains 'cancelled'
alter table public.orders drop constraint if exists orders_status_allowed;
alter table public.orders add constraint orders_status_allowed
  check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));

alter table public.order_status_history drop constraint if exists order_status_history_status_allowed;
alter table public.order_status_history add constraint order_status_history_status_allowed
  check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'));


-- ============================================================================
-- 0012: 0012_product_images_storage.sql
-- Storage bucket for product images.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());


-- ============================================================================
-- 0013: 0013_orders_realtime.sql
-- Admin app order notifications — subscribe to new orders via Supabase Realtime.
-- ============================================================================

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;


-- ============================================================================
-- 0014: 0014_enable_stock_decrement.sql
-- Client-confirmed stock policy: placing an order REDUCES products.stock_quantity.
-- ============================================================================

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
  v_decrement_stock constant boolean := true;
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

  -- 8. Stock decrement (enabled from 0014).
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
  'Atomically creates an order (+items, +status history, -stock) from the caller''s cart and clears it. Owner-only via auth.uid().';

revoke all on function public.place_order(uuid) from public, anon, authenticated;
grant execute on function public.place_order(uuid) to authenticated;
-- 0015_banners_and_settings.sql
-- Hero slider banners and global store settings for Classic Collection Solapur.

create table if not exists public.hero_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  image_url text not null,
  link_url text not null default '/pages/listing.html',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.hero_banners enable row level security;

revoke all privileges on public.hero_banners from anon, authenticated;
grant select on public.hero_banners to anon, authenticated;
grant insert, update, delete on public.hero_banners to authenticated;

drop policy if exists hero_banners_public_read on public.hero_banners;
create policy hero_banners_public_read on public.hero_banners
for select to anon, authenticated
using (is_active = true);

drop policy if exists hero_banners_admin_all on public.hero_banners;
create policy hero_banners_admin_all on public.hero_banners
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.store_settings (
  key text primary key,
  value text not null default '',
  description text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

revoke all privileges on public.store_settings from anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant insert, update, delete on public.store_settings to authenticated;

drop policy if exists store_settings_public_read on public.store_settings;
create policy store_settings_public_read on public.store_settings
for select to anon, authenticated
using (true);

drop policy if exists store_settings_admin_all on public.store_settings;
create policy store_settings_admin_all on public.store_settings
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.store_settings (key, value, description)
values 
  ('announcement_text', 'Classic Collection Solapur — Premium Cloth Materials | Fast Shipping Across India', 'Storefront announcement ticker text'),
  ('free_shipping_above', '999', 'Free shipping minimum order amount'),
  ('standard_shipping_fee', '60', 'Standard shipping fee below threshold')
on conflict (key) do nothing;
-- 0016_seed_prd_taxonomy.sql
-- Seed initial catalog taxonomy strictly per Classic_PRD.pdf requirements:
-- Category: Men's
-- Styles: Formal, Casual
-- Patterns: Whites, Plain, Stripes, Checks, Prints (Formal) & Checks, Whites, Solid, Prints (Casual)
-- Materials: Cotton, Linen, Khadi, Silk, Linen Cotton

do $$
declare
  v_mens_cat_id uuid;
  v_formal_style_id uuid;
  v_casual_style_id uuid;
begin
  -- 1. Insert Men's Category
  insert into public.categories (name, slug)
  values ('Men''s', 'mens')
  on conflict (slug) do update set name = excluded.name
  returning id into v_mens_cat_id;

  if v_mens_cat_id is null then
    select id into v_mens_cat_id from public.categories where slug = 'mens';
  end if;

  -- 2. Insert Formal Style under Men's
  insert into public.styles (category_id, name, slug)
  values (v_mens_cat_id, 'Formal', 'formal')
  on conflict (category_id, slug) do update set name = excluded.name
  returning id into v_formal_style_id;

  if v_formal_style_id is null then
    select id into v_formal_style_id from public.styles where category_id = v_mens_cat_id and slug = 'formal';
  end if;

  -- 3. Insert Casual Style under Men's
  insert into public.styles (category_id, name, slug)
  values (v_mens_cat_id, 'Casual', 'casual')
  on conflict (category_id, slug) do update set name = excluded.name
  returning id into v_casual_style_id;

  if v_casual_style_id is null then
    select id into v_casual_style_id from public.styles where category_id = v_mens_cat_id and slug = 'casual';
  end if;

  -- 4. Formal Patterns (Whites, Plain, Stripes, Checks, Prints)
  insert into public.patterns (style_id, name, slug) values
    (v_formal_style_id, 'Whites', 'whites'),
    (v_formal_style_id, 'Plain', 'plain'),
    (v_formal_style_id, 'Stripes', 'stripes'),
    (v_formal_style_id, 'Checks', 'formal-checks'),
    (v_formal_style_id, 'Prints', 'formal-prints')
  on conflict (style_id, slug) do nothing;

  -- 5. Casual Patterns (Checks, Whites, Solid, Prints)
  insert into public.patterns (style_id, name, slug) values
    (v_casual_style_id, 'Checks', 'casual-checks'),
    (v_casual_style_id, 'Whites', 'casual-whites'),
    (v_casual_style_id, 'Solid', 'solid'),
    (v_casual_style_id, 'Prints', 'casual-prints')
  on conflict (style_id, slug) do nothing;

  -- 6. Fabric Materials (Cotton, Linen, Khadi, Silk, Linen Cotton)
  insert into public.materials (name) values
    ('Cotton'),
    ('Linen'),
    ('Khadi'),
    ('Silk'),
    ('Linen Cotton')
  on conflict (name) do nothing;

  -- 7. Initial Hero Banners for Classic Collection Solapur
  insert into public.hero_banners (title, subtitle, image_url, link_url, display_order, is_active) values
    ('CLASSIC MEN''S FORMAL FABRICS', 'PREMIUM COTTON, LINEN & KHADI SUITING MATERIALS', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80', '/pages/listing.html?category=mens&style=formal', 1, true),
    ('EXCLUSIVE HANDLOOM SILK & KHADI', 'TRADITIONAL TEXTILES CRAFTED WITH LUXURY FINISH', 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1600&q=80', '/pages/listing.html?material=Khadi', 2, true),
    ('CASUAL SHIRTING & LINEN COTTON', 'BREATHABLE WEAVES DESIGNED FOR TIMELESS COMFORT', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1600&q=80', '/pages/listing.html?category=mens&style=casual', 3, true)
  on conflict do nothing;

end $$;
