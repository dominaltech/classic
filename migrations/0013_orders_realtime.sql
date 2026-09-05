-- 0013_orders_realtime.sql
-- Admin app (order notifications, client requirement) — subscribe to new
-- orders INSTANTLY via Supabase Realtime. postgres_changes only broadcasts
-- tables that are in the supabase_realtime publication, so add `orders`
-- here. The listener connects as the authenticated admin, and Realtime
-- honors table RLS — only is_admin() selects can ever hear these rows
-- (policy orders_admin_read from 0011).
--
-- Run AFTER 0012 in the Supabase SQL editor. Idempotent: safe to re-run.

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

-- INSERT events always carry the full NEW row, so no REPLICA IDENTITY
-- change is needed (that only matters for UPDATE/DELETE old-record data).
