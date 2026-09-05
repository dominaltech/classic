-- 0002_create_categories_styles_patterns.sql
-- Catalog taxonomy: category, then style, then pattern.

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
