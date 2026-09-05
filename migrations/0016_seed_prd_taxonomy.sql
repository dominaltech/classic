-- 0016_seed_prd_taxonomy.sql
-- Seed initial catalog taxonomy strictly per Classic_PRD.pdf requirements:
-- Category: Men's
-- Styles: Formal, Casual
-- Patterns: Whites, Plain, Stripes, Checks, Prints (Formal) & Checks, Whites, Solid, Prints (Casual)
-- Materials: Cotton, Linen, Khadi, Silk, Linen Cotton

do $$
declare
  v_mens_cat_id uuid;
  v_formal_style_id uuid;
  v_casual_style_id uuid;
begin
  -- 1. Insert Men's Category
  insert into public.categories (name, slug)
  values ('Men''s', 'mens')
  on conflict (slug) do update set name = excluded.name
  returning id into v_mens_cat_id;

  if v_mens_cat_id is null then
    select id into v_mens_cat_id from public.categories where slug = 'mens';
  end if;

  -- 2. Insert Formal Style under Men's
  insert into public.styles (category_id, name, slug)
  values (v_mens_cat_id, 'Formal', 'formal')
  on conflict (category_id, slug) do update set name = excluded.name
  returning id into v_formal_style_id;

  if v_formal_style_id is null then
    select id into v_formal_style_id from public.styles where category_id = v_mens_cat_id and slug = 'formal';
  end if;

  -- 3. Insert Casual Style under Men's
  insert into public.styles (category_id, name, slug)
  values (v_mens_cat_id, 'Casual', 'casual')
  on conflict (category_id, slug) do update set name = excluded.name
  returning id into v_casual_style_id;

  if v_casual_style_id is null then
    select id into v_casual_style_id from public.styles where category_id = v_mens_cat_id and slug = 'casual';
  end if;

  -- 4. Formal Patterns (Whites, Plain, Stripes, Checks, Prints)
  insert into public.patterns (style_id, name, slug) values
    (v_formal_style_id, 'Whites', 'whites'),
    (v_formal_style_id, 'Plain', 'plain'),
    (v_formal_style_id, 'Stripes', 'stripes'),
    (v_formal_style_id, 'Checks', 'formal-checks'),
    (v_formal_style_id, 'Prints', 'formal-prints')
  on conflict (style_id, slug) do nothing;

  -- 5. Casual Patterns (Checks, Whites, Solid, Prints)
  insert into public.patterns (style_id, name, slug) values
    (v_casual_style_id, 'Checks', 'casual-checks'),
    (v_casual_style_id, 'Whites', 'casual-whites'),
    (v_casual_style_id, 'Solid', 'solid'),
    (v_casual_style_id, 'Prints', 'casual-prints')
  on conflict (style_id, slug) do nothing;

  -- 6. Fabric Materials (Cotton, Linen, Khadi, Silk, Linen Cotton)
  insert into public.materials (name) values
    ('Cotton'),
    ('Linen'),
    ('Khadi'),
    ('Silk'),
    ('Linen Cotton')
  on conflict (name) do nothing;

  -- 7. Initial Hero Banners for Classic Collection Solapur
  insert into public.hero_banners (title, subtitle, image_url, link_url, display_order, is_active) values
    ('CLASSIC MEN''S FORMAL FABRICS', 'PREMIUM COTTON, LINEN & KHADI SUITING MATERIALS', 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80', '/pages/listing.html?category=mens&style=formal', 1, true),
    ('EXCLUSIVE HANDLOOM SILK & KHADI', 'TRADITIONAL TEXTILES CRAFTED WITH LUXURY FINISH', 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=1600&q=80', '/pages/listing.html?material=Khadi', 2, true),
    ('CASUAL SHIRTING & LINEN COTTON', 'BREATHABLE WEAVES DESIGNED FOR TIMELESS COMFORT', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1600&q=80', '/pages/listing.html?category=mens&style=casual', 3, true)
  on conflict do nothing;

end $$;
