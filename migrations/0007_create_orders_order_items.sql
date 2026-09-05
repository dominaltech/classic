-- 0007_create_orders_order_items.sql
-- Order header and line items with immutable snapshot fields.

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
