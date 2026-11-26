-- Curly Girl Sanctuary, Phase 2b: Curl Kit products and moderators.
--
-- Paste this file into the SQL editor of each Supabase project, after 0001_phase2.sql.

-- Who added a product is never sent to anyone, moderators included: the app may read
-- every column of products except added_by. The row rules still use it on the server.
revoke select on public.products from anon, authenticated;
grant select (id, brand, name, kind, status, merged_into, created_at) on public.products to anon, authenticated;

-- "Add your own": the new product (waiting for a moderator) and its place in the
-- member's kit are made together, so a failed step never leaves a product in no kit.
-- The kit's own row is made too, at the kit's default audience (Everyone), if missing.
create function public.add_own_product(new_brand text, new_name text, new_kind text)
returns table (id bigint, brand text, name text, kind text, status text)
language plpgsql security definer set search_path = '' as $$
declare new_id bigint;
begin
  if not public.is_member() then raise exception 'cgs: members only'; end if;
  insert into public.products (brand, name, kind, added_by)
    values (trim(new_brand), trim(new_name), new_kind, auth.uid())
    returning public.products.id into new_id;
  insert into public.profile_items (member, item, visibility) values (auth.uid(), 'kit', 'everyone')
    on conflict do nothing;
  insert into public.kit_products (member, product_id) values (auth.uid(), new_id);
  return query select p.id, p.brand, p.name, p.kind, p.status from public.products p where p.id = new_id;
end
$$;

-- A moderator can turn down a product a member added. It was only ever seen by that
-- member (and moderators) and leaves their kit too. Approved products are never turned
-- down: a duplicate is merged into the one to keep instead, so no kit loses it.
create function public.turn_down_product(product bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'cgs: moderators only'; end if;
  if not exists (select 1 from public.products where id = product and status = 'pending') then
    raise exception 'cgs: only a product waiting for a check can be turned down';
  end if;
  delete from public.products where id = product and status = 'pending';
end
$$;

revoke execute on function public.add_own_product(text, text, text), public.turn_down_product(bigint) from public, anon;
grant execute on function public.add_own_product(text, text, text), public.turn_down_product(bigint) to authenticated;
