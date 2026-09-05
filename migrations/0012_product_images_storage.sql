-- 0012_product_images_storage.sql
-- Phase 0 (Admin App prep) — Supabase Storage bucket for product images.
-- The admin app (Phase 8) uploads product photos here; product_images.image_url
-- stores the resulting PUBLIC URL, which the customer website renders directly.
--
-- Public read (website <img> tags must work signed-out), admin-only writes.
-- Run AFTER 0011 (uses public.is_admin()). Idempotent: safe to re-run.

-- ============================================================================
-- 1) Bucket: public, 5 MB per file, common web image formats only.
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

-- ============================================================================
-- 2) Storage RLS policies (storage.objects already has RLS enabled by Supabase).
-- ============================================================================

-- Anyone (including signed-out website visitors) can read/download images.
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'product-images');

-- Only the admin can upload into this bucket.
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());

-- Only the admin can overwrite existing objects.
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());

-- Only the admin can delete objects (image removal deletes Storage + DB row).
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());
