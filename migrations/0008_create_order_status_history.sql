-- 0008_create_order_status_history.sql
-- Append-only order status timeline. Customers read it; status writes happen in the admin flow or trusted RPC.

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
