-- 0006_create_cart_items_table.sql
-- Customer-owned cart rows. One row per customer and product pair.

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
