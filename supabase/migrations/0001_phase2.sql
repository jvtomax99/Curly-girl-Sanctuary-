-- Curly Girl Sanctuary, Phase 2: accounts, profile with per-item visibility,
-- Curl Kit, moderator product tools, delete account.
--
-- Paste this whole file once into the SQL editor of each Supabase project.
-- Every rule about who may read or change what lives here, on the server: the app's
-- screens only show what these rules already allow (CLAUDE.md, "Privacy by choice").
--
-- Visibility: only_me (the owner), community (anyone logged in with a profile),
-- everyone (anyone, logged in or not). Heritage always starts as only_me.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.visibility as enum ('only_me', 'community', 'everyone');
create type public.profile_item as enum ('card', 'scalp', 'heritage', 'kit');

-- ---------------------------------------------------------------------------
-- Members
-- ---------------------------------------------------------------------------

-- What a shared link shows: the curly username and the avatar choice. Readable by all.
-- Hidden from everyone else until the email is confirmed, so a typo'd or borrowed
-- address never shows up as a member.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  avatar text not null default 'curls-1' check (avatar ~ '^[a-z0-9-]{1,30}$'),
  confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

-- Sign-ups are closed on the server until the owner opens them (Susan's policy, terms,
-- guidelines and the minimum age first). Until then only emails on the allow-list can
-- join: Jose, Susan and testers. Both are changed by hand in the SQL editor.
create table public.app_settings (
  id boolean primary key default true check (id),
  signups_open boolean not null default false
);
insert into public.app_settings default values;

create table public.signup_allowlist (
  email text primary key check (email = lower(email))
);

-- Never shown to anyone but the member: names and what they agreed to at sign-up.
create table public.members_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  first_name text not null check (char_length(first_name) between 1 and 50),
  last_name text not null check (char_length(last_name) between 1 and 50),
  age_confirmed_at timestamptz not null,
  guidelines_accepted_at timestamptz not null,
  policy_version text not null check (char_length(policy_version) between 1 and 40)
);

-- One row per profile item, each with its own audience.
create table public.profile_items (
  member uuid not null references public.profiles (id) on delete cascade,
  item public.profile_item not null,
  value jsonb not null default '{}'::jsonb check (pg_column_size(value) < 4000),
  visibility public.visibility not null default 'only_me',
  updated_at timestamptz not null default now(),
  primary key (member, item)
);

-- Owner and moderators, added by hand in the SQL editor (see docs/phase2-plan.md).
create table public.staff (
  member uuid primary key references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'moderator'))
);

-- ---------------------------------------------------------------------------
-- Curl Kit
-- ---------------------------------------------------------------------------

-- A product someone adds stays pending (seen only by them and moderators) until a
-- moderator approves it. Merged duplicates keep their row, pointing at the kept one.
create table public.products (
  id bigint generated always as identity primary key,
  brand text not null check (char_length(brand) between 1 and 60),
  name text not null check (char_length(name) between 1 and 100),
  kind text not null check (kind ~ '^[a-z0-9-]{1,30}$'),
  status text not null default 'pending' check (status in ('approved', 'pending')),
  added_by uuid references public.profiles (id) on delete set null,
  merged_into bigint references public.products (id),
  created_at timestamptz not null default now()
);

create table public.kit_products (
  member uuid not null references public.profiles (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (member, product_id)
);

create table public.kit_tools (
  member uuid not null references public.profiles (id) on delete cascade,
  tool text not null check (tool ~ '^[a-z0-9-]{1,40}$'),
  primary key (member, tool)
);

-- ---------------------------------------------------------------------------
-- Checks used by the rules
-- ---------------------------------------------------------------------------

-- A member is someone logged in with a confirmed profile (not a visitor, not a
-- half-made or unconfirmed account).
create function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and confirmed)
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff where member = auth.uid())
$$;

-- May the person asking see this member's item? The owner always; otherwise the
-- item's own visibility decides. A missing item is visible to nobody but the owner.
create function public.can_see(owner uuid, what public.profile_item) returns boolean
language sql stable security definer set search_path = '' as $$
  select owner = auth.uid() or exists (
    select 1 from public.profile_items i
    join public.profiles p on p.id = i.member and p.confirmed
    where i.member = owner and i.item = what
      and (i.visibility = 'everyone' or (i.visibility = 'community' and public.is_member()))
  )
$$;

-- ---------------------------------------------------------------------------
-- Row rules
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.members_private enable row level security;
alter table public.profile_items enable row level security;
alter table public.staff enable row level security;
alter table public.app_settings enable row level security;
alter table public.signup_allowlist enable row level security;
alter table public.products enable row level security;
alter table public.kit_products enable row level security;
alter table public.kit_tools enable row level security;

create policy "profiles: confirmed ones, or your own" on public.profiles for select
  using (confirmed or id = auth.uid());
-- app_settings and signup_allowlist have no policies: nobody reads or changes them
-- through the app. The sign-up check below reads them as the server.
create policy "profiles: owner edits" on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "private: owner reads" on public.members_private for select using (id = auth.uid());
create policy "private: owner edits" on public.members_private for update
  using (id = auth.uid()) with check (id = auth.uid());

create policy "items: by visibility" on public.profile_items for select
  using (public.can_see(member, item));
create policy "items: owner adds" on public.profile_items for insert
  with check (member = auth.uid() and public.is_member());
create policy "items: owner edits" on public.profile_items for update
  using (member = auth.uid()) with check (member = auth.uid());
create policy "items: owner removes" on public.profile_items for delete
  using (member = auth.uid());

create policy "staff: see own role" on public.staff for select using (member = auth.uid());

create policy "products: approved, own or staff" on public.products for select
  using ((status = 'approved' and merged_into is null) or added_by = auth.uid() or public.is_staff());
create policy "products: members add pending" on public.products for insert
  with check (added_by = auth.uid() and status = 'pending' and merged_into is null and public.is_member());

create policy "kit: by visibility" on public.kit_products for select
  using (public.can_see(member, 'kit'));
create policy "kit: owner adds a product they can see" on public.kit_products for insert
  with check (member = auth.uid() and public.is_member()
    and exists (select 1 from public.products p where p.id = product_id));
create policy "kit: owner removes" on public.kit_products for delete using (member = auth.uid());

create policy "tools: by visibility" on public.kit_tools for select
  using (public.can_see(member, 'kit'));
create policy "tools: owner adds" on public.kit_tools for insert
  with check (member = auth.uid() and public.is_member());
create policy "tools: owner removes" on public.kit_tools for delete using (member = auth.uid());

-- Column limits: members may change only these columns, even on their own rows.
-- Profiles, names and staff are created and removed only by the server's own functions.
revoke insert, update, delete on public.profiles, public.members_private, public.staff from anon, authenticated;
revoke all on public.app_settings, public.signup_allowlist from anon, authenticated;
revoke update, delete on public.products from anon, authenticated;
revoke update on public.profile_items, public.kit_products, public.kit_tools from anon, authenticated;
grant update (username, avatar) on public.profiles to authenticated;
grant update (first_name, last_name) on public.members_private to authenticated;
grant update (value, visibility, updated_at) on public.profile_items to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Sign-up: the app sends the names, curly username and the two yeses as sign-up data.
-- The server refuses the account while sign-ups are closed (unless the email is on the
-- allow-list), or without both yeses. Names are then removed from the sign-in record,
-- so they live only in members_private, where the member can change them.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  if not (select signups_open from public.app_settings)
     and not exists (select 1 from public.signup_allowlist where email = lower(new.email)) then
    raise exception 'cgs: sign-ups are not open yet';
  end if;
  if coalesce((m ->> 'age_ok')::boolean, false) is not true
     or coalesce((m ->> 'guidelines_ok')::boolean, false) is not true then
    raise exception 'cgs: age and guidelines must be accepted';
  end if;
  insert into public.profiles (id, username, confirmed)
  values (new.id, lower(trim(m ->> 'username')), new.email_confirmed_at is not null);
  insert into public.members_private (id, first_name, last_name, age_confirmed_at, guidelines_accepted_at, policy_version)
  values (new.id, trim(m ->> 'first_name'), trim(m ->> 'last_name'), now(), now(),
          coalesce(m ->> 'policy_version', 'draft'));
  update auth.users set raw_user_meta_data = raw_user_meta_data - 'first_name' - 'last_name' where id = new.id;
  return new;
end
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- The profile shows once the email link is tapped.
create function public.handle_confirmed_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set confirmed = true where id = new.id and not confirmed;
  return new;
end
$$;

create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row when (new.email_confirmed_at is not null and old.email_confirmed_at is null)
  execute function public.handle_confirmed_user();

-- Heritage always starts as Only me, whatever the app sends.
create function public.heritage_starts_private() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.item = 'heritage' then new.visibility := 'only_me'; end if;
  new.updated_at := now();
  return new;
end
$$;

create trigger heritage_starts_private before insert on public.profile_items
  for each row execute function public.heritage_starts_private();

-- A member's pending products leave with them; approved ones stay for other kits.
create function public.drop_pending_products() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.products where added_by = old.id and status = 'pending';
  return old;
end
$$;

create trigger drop_pending_products before delete on public.profiles
  for each row execute function public.drop_pending_products();

-- ---------------------------------------------------------------------------
-- Functions the app calls
-- ---------------------------------------------------------------------------

create function public.username_available(name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (select 1 from public.profiles where username = lower(trim(name)))
$$;

-- Product suggestions with how many members use each. Counts only kits not set to
-- Only me (Community kits count for visitors too: a number, never who).
create function public.search_products(q text)
returns table (id bigint, brand text, name text, kind text, members bigint)
language sql stable security definer set search_path = '' as $$
  select p.id, p.brand, p.name, p.kind,
    (select count(*) from public.kit_products k
       join public.profile_items i on i.member = k.member and i.item = 'kit'
      where k.product_id = p.id and i.visibility <> 'only_me') as members
  from public.products p
  where p.status = 'approved' and p.merged_into is null
    and char_length(trim(q)) >= 2
    and (p.brand ilike '%' || replace(replace(replace(trim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%'
      or p.name ilike '%' || replace(replace(replace(trim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%')
  order by members desc, p.brand, p.name
  limit 10
$$;

create function public.approve_product(product bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'cgs: moderators only'; end if;
  update public.products set status = 'approved' where id = product and merged_into is null;
end
$$;

-- Moves every kit from the duplicate to the kept product, then marks the duplicate merged.
create function public.merge_products(duplicate bigint, kept bigint) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_staff() then raise exception 'cgs: moderators only'; end if;
  if duplicate = kept then raise exception 'cgs: pick two different products'; end if;
  if not exists (select 1 from public.products where id = kept and status = 'approved' and merged_into is null) then
    raise exception 'cgs: the kept product must be approved';
  end if;
  insert into public.kit_products (member, product_id)
    select member, kept from public.kit_products where product_id = duplicate
    on conflict do nothing;
  delete from public.kit_products where product_id = duplicate;
  update public.products set merged_into = kept where id = duplicate;
end
$$;

-- Removes accounts whose email was never confirmed within a week (typo'd or borrowed
-- addresses), freeing their usernames. Moderators run it; it can also be scheduled.
create function public.purge_unconfirmed() returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if auth.uid() is not null and not public.is_staff() then raise exception 'cgs: moderators only'; end if;
  delete from auth.users u
  using public.profiles p
  where p.id = u.id and not p.confirmed and u.email_confirmed_at is null
    and u.created_at < now() - interval '7 days';
  get diagnostics n = row_count;
  return n;
end
$$;

-- Deletes the caller's account; everything above that belongs to them goes with it.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'cgs: not logged in'; end if;
  delete from auth.users where id = auth.uid();
end
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
revoke execute on function public.approve_product(bigint), public.merge_products(bigint, bigint) from public, anon;
grant execute on function public.approve_product(bigint), public.merge_products(bigint, bigint) to authenticated;
revoke execute on function public.purge_unconfirmed() from public, anon;
grant execute on function public.purge_unconfirmed() to authenticated;
revoke execute on function public.handle_new_user(), public.handle_confirmed_user(), public.drop_pending_products() from public, anon, authenticated;
