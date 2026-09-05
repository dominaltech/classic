-- 0003_create_materials_table.sql
-- Reusable material options used by listing filters.

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.materials add column if not exists name text;
alter table public.materials add column if not exists created_at timestamptz not null default now();
create unique index if not exists materials_name_key on public.materials (name);
