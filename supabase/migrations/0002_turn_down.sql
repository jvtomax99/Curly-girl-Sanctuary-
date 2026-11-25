-- Curly Girl Sanctuary, Phase 2b: a moderator can turn down a product a member added.
--
-- Paste this file into the SQL editor of each Supabase project, after 0001_phase2.sql.
-- A turned-down product was only ever seen by the member who added it (and moderators);
-- it leaves that member's kit too. Approved products are never turned down: a duplicate
-- is merged into the one to keep instead (merge_products), so no kit loses it.
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

revoke execute on function public.turn_down_product(bigint) from public, anon;
grant execute on function public.turn_down_product(bigint) to authenticated;
