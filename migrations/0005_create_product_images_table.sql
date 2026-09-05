-- 0005_create_product_images_table.sql
-- Public product imagery stored in the product-images bucket.

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
