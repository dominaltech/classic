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
