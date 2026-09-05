-- 0004_create_products_table.sql
-- Sellable catalog products.

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
