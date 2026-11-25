-- Server rule tests: made-up members A and B, a half-made account D (logged in, no
-- profile) and a logged-out visitor. Every check asks the database directly, as that
-- person, so it proves what the server allows, not what a screen shows.
-- Run with tools/db-check.sh. Any failed check stops the run with "FAIL: ...".
\set ON_ERROR_STOP 1
\set QUIET 1
\o /dev/null
set client_min_messages = warning;

-- Test helpers (made as the database owner, used by everyone).
create schema t;
grant usage on schema t to anon, authenticated;
create function t.ok(cond boolean, msg text) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', msg; end if;
end $$;
-- The statement must be refused (any error), as whoever is running it.
create function t.refused(stmt text, msg text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    return;
  end;
  raise exception 'FAIL (was allowed): %', msg;
end $$;
-- The statement may run but must change no rows.
create function t.no_rows(stmt text, msg text) returns void language plpgsql as $$
declare n int;
begin
  execute stmt;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL (% rows changed): %', n, msg; end if;
end $$;
grant execute on all functions in schema t to anon, authenticated;

-- People. A: aaaa..., B: bbbb..., D: dddd...
\set A '''aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'''
\set B '''bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'''
\set D '''dddddddd-dddd-dddd-dddd-dddddddddddd'''

-- Sign-ups start closed: only allow-listed emails can join.
select t.refused($$insert into auth.users (id, email, raw_user_meta_data) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'stranger@example.test',
  '{"username":"stranger","first_name":"No","last_name":"Yes","age_ok":true,"guidelines_ok":true}')$$, 'sign-up while closed');
insert into public.signup_allowlist (email) values ('tester@example.test');
insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Tester@Example.test', now(),
  '{"username":"tester","first_name":"Tess","last_name":"Madeup","age_ok":true,"guidelines_ok":true}');
select t.ok(exists (select 1 from public.profiles where username = 'tester'), 'an allow-listed email joins while closed');
select t.ok((select raw_user_meta_data ? 'first_name' or raw_user_meta_data ? 'last_name' from auth.users where email = 'Tester@Example.test') = false,
  'names are removed from the sign-in record');
select t.ok((select first_name from public.members_private where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc') = 'Tess', 'names kept for the member');
update public.app_settings set signups_open = true;

-- Sign-up refuses an account without both yeses, or with a taken or bad username.
select t.refused($$insert into auth.users (id, raw_user_meta_data) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '{"username":"nope","first_name":"No","last_name":"Yes","age_ok":true}')$$, 'sign-up without guidelines');
select t.refused($$insert into auth.users (id, raw_user_meta_data) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '{"username":"nope","first_name":"No","last_name":"Yes","guidelines_ok":true}')$$, 'sign-up without age');
select t.refused($$insert into auth.users (id, raw_user_meta_data) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '{"username":"no spaces!","first_name":"No","last_name":"Yes","age_ok":true,"guidelines_ok":true}')$$, 'bad username');

insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values
  (:A, 'ana@example.test', now(), '{"username":"Coily.Ana","first_name":"Ana","last_name":"Testperson","age_ok":true,"guidelines_ok":true}'),
  (:B, 'bea@example.test', now(), '{"username":"wavy_bea","first_name":"Bea","last_name":"Madeup","age_ok":true,"guidelines_ok":true}'),
  (:D, 'dee@example.test', now(), '{"username":"halfmade","first_name":"Dee","last_name":"Stub","age_ok":true,"guidelines_ok":true}');
-- U joined but never tapped the email link.
\set U '''ffffffff-ffff-ffff-ffff-ffffffffffff'''
insert into auth.users (id, email, raw_user_meta_data) values
  (:U, 'typo@example.test', '{"username":"unconfirmed","first_name":"Una","last_name":"Madeup","age_ok":true,"guidelines_ok":true}');
select t.refused($$insert into auth.users (id, raw_user_meta_data) values ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '{"username":"WAVY_bea","first_name":"No","last_name":"Yes","age_ok":true,"guidelines_ok":true}')$$, 'taken username (any case)');
select t.ok((select username from public.profiles where id = :A) = 'coily.ana', 'username saved in lower case');
-- D is logged in but has no profile (an account that never finished).
delete from public.profiles where id = :D;

-- Products for the kit (made-up brands).
insert into public.products (brand, name, kind, status) values
  ('Spiral Test Co', 'Hydra Curl Cream', 'cream', 'approved'),
  ('Madeup Botanics', 'Hydrating Leave-In', 'leave-in', 'approved'),
  ('Madeup Botanics', 'Hydrating Leave In', 'leave-in', 'approved');

-- ---------------------------------------------------------------- A sets up a profile
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
insert into public.profile_items (member, item, value, visibility) values
  (:A, 'card', '{"pattern":"4A","porosity":"high"}', 'community'),
  (:A, 'scalp', '{"scalp":"dry"}', 'everyone'),
  (:A, 'heritage', '{"values":["mixed"]}', 'everyone'),
  (:A, 'kit', '{"dry":"diffuse"}', 'only_me');
select t.ok((select visibility from public.profile_items where member = :A and item = 'heritage') = 'only_me',
  'heritage starts as Only me even when the app asks for Everyone');
select t.ok((select count(*) from public.profile_items where member = :A) = 4, 'A sees all of A''s items');
select t.ok((select count(*) from public.members_private where id = :A) = 1, 'A reads own names');
select t.refused($$update public.members_private set age_confirmed_at = now() where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'A changes the sign-up dates');
update public.members_private set first_name = 'Anita' where id = :A;
select t.refused($$insert into public.profile_items (member, item) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'card')$$,
  'A adds an item to B''s profile');
select t.refused($$insert into public.staff (member, role) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner')$$,
  'A makes themself staff');
select t.refused($$update public.profiles set id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'A changes a profile id');
select t.refused($$insert into public.profile_items (member, item, value) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'card', '{}') $$,
  'duplicate item');

-- ---------------------------------------------------------------- What others see
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select t.ok((select string_agg(item::text, ',' order by item) from public.profile_items where member = :A) = 'card,scalp',
  'member B sees only A''s Community and Everyone items');
select t.ok((select count(*) from public.members_private where id = :A) = 0, 'B can''t read A''s names');
select t.no_rows($$update public.profile_items set visibility = 'everyone' where member = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'B changes A''s visibility');
select t.no_rows($$update public.profiles set username = 'stolen' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'B renames A');
select t.no_rows($$delete from public.profile_items where member = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$, 'B deletes A''s items');

select set_config('request.jwt.claims', '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd"}', false);
select t.ok((select string_agg(item::text, ',') from public.profile_items where member = :A) = 'scalp',
  'a logged-in account without a profile counts as a visitor');
select t.refused($$insert into public.profile_items (member, item) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'card')$$,
  'an account without a profile adds items');

-- Unconfirmed accounts: invisible to others, but their username stays taken.
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"ffffffff-ffff-ffff-ffff-ffffffffffff"}', false);
select t.refused($$insert into public.profile_items (member, item) values ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'card')$$,
  'an unconfirmed account adds items');
select t.ok(exists (select 1 from public.profiles where id = :U), 'an unconfirmed member sees their own profile');
reset role;
insert into public.profile_items (member, item, value, visibility) values (:U, 'scalp', '{"scalp":"oily"}', 'everyone');
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select t.ok(not exists (select 1 from public.profiles where id = :U), 'B can''t see an unconfirmed profile');
select t.ok(not exists (select 1 from public.profile_items where member = :U), 'B can''t see an unconfirmed member''s items');
select t.refused($$select public.purge_unconfirmed()$$, 'a non-moderator purges accounts');
reset role;
set role anon;
select set_config('request.jwt.claims', '', false);
select t.ok(not exists (select 1 from public.profiles where id = :U), 'a visitor can''t see an unconfirmed profile');
select t.ok(not exists (select 1 from public.profile_items where member = :U), 'a visitor can''t see an unconfirmed member''s Everyone items');
select t.ok(not public.username_available('unconfirmed'), 'an unconfirmed username stays taken');
select t.refused($$select * from public.app_settings$$, 'a visitor reads the sign-up setting');
select t.refused($$insert into public.signup_allowlist values ('me@example.test')$$, 'a visitor adds to the allow-list');
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
select t.refused($$update public.app_settings set signups_open = false$$, 'a member changes the sign-up setting');
select t.refused($$update public.profiles set confirmed = true where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'$$, 'a member confirms a profile');
reset role;
update auth.users set email_confirmed_at = now() where id = :U;
set role anon;
select t.ok(exists (select 1 from public.profile_items where member = :U), 'tapping the email link makes the profile visible');
reset role;
-- A week-old unconfirmed account is removed by the clean-up; a newer one stays.
insert into auth.users (id, email, created_at, raw_user_meta_data) values
  ('99999999-9999-9999-9999-999999999999', 'old@example.test', now() - interval '8 days',
   '{"username":"oldtypo","first_name":"Old","last_name":"Madeup","age_ok":true,"guidelines_ok":true}'),
  ('88888888-8888-8888-8888-888888888888', 'new@example.test', now(),
   '{"username":"newtypo","first_name":"New","last_name":"Madeup","age_ok":true,"guidelines_ok":true}');
select set_config('request.jwt.claims', '', false);
select t.ok(public.purge_unconfirmed() = 1, 'the clean-up removes exactly the week-old unconfirmed account');
select t.ok(public.username_available('oldtypo') and not public.username_available('newtypo'), 'the clean-up frees only that username');

set role anon;
select set_config('request.jwt.claims', '', false);
select t.ok((select string_agg(item::text, ',') from public.profile_items where member = :A) = 'scalp',
  'a logged-out visitor sees only Everyone items');
select t.ok((select count(*) from public.profiles where id = :A) = 1, 'a visitor can open a profile by link');
select t.ok((select count(*) from public.members_private) = 0, 'a visitor reads no names');
select t.refused($$insert into public.profile_items (member, item) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'kit')$$,
  'a visitor adds an item');
select t.refused($$select public.delete_my_account()$$, 'a visitor calls delete account');
select t.ok(public.username_available('Someone.New') and not public.username_available('COILY.ANA'),
  'username check works for visitors, any case');

-- ---------------------------------------------------------------- A changes heritage
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
update public.profile_items set visibility = 'community' where member = :A and item = 'heritage';
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select t.ok(exists (select 1 from public.profile_items where member = :A and item = 'heritage'),
  'B sees heritage once A picks Community');
reset role;
set role anon;
select set_config('request.jwt.claims', '', false);
select t.ok(not exists (select 1 from public.profile_items where member = :A and item = 'heritage'),
  'a visitor still can''t see Community heritage');
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
update public.profile_items set visibility = 'only_me' where member = :A and item = 'heritage';
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select t.ok(not exists (select 1 from public.profile_items where member = :A and item = 'heritage'),
  'back to Only me hides heritage from B again');

-- ---------------------------------------------------------------- Curl Kit
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
select t.refused($$insert into public.products (brand, name, kind, status, added_by) values
  ('Mine', 'Sneaky', 'gel', 'approved', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$, 'a member adds an already-approved product');
insert into public.products (brand, name, kind, added_by) values ('Kitchen Test', 'Flax Gel', 'gel', :A);
select id as flax_id from public.products where name = 'Flax Gel' \gset
insert into public.kit_products (member, product_id)
  select :A, id from public.products where name in ('Hydra Curl Cream', 'Hydrating Leave In', 'Flax Gel');
insert into public.kit_tools (member, tool) values (:A, 'diffuser');
select t.ok((select count(*) from public.kit_products where member = :A) = 3, 'A sees own kit, pending product included');

select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select t.ok(not exists (select 1 from public.products where name = 'Flax Gel'), 'B can''t see A''s pending product');
select t.refused(format('insert into public.kit_products (member, product_id) values (%L, %s)', :B, :flax_id),
  'B adds a product B can''t see');
select t.refused($$insert into public.kit_products (member, product_id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 999)$$,
  'B adds a product that doesn''t exist');
select t.ok((select count(*) from public.kit_products where member = :A) = 0, 'Only me kit is hidden from B');
select t.ok((select count(*) from public.kit_tools where member = :A) = 0, 'Only me tools are hidden from B');
select t.ok((select coalesce(sum(members), 0) from public.search_products('hyd')) = 0,
  'an Only me kit is not counted in suggestions');
insert into public.profile_items (member, item, visibility) values (:B, 'kit', 'everyone');
insert into public.kit_products (member, product_id) select :B, id from public.products where name = 'Hydra Curl Cream';

select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
update public.profile_items set visibility = 'community' where member = :A and item = 'kit';
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select t.ok((select count(*) from public.kit_products where member = :A) = 3, 'Community kit is visible to B');
select t.ok((select members from public.search_products('hyd') where name = 'Hydra Curl Cream') = 2,
  'typing "hyd" suggests Hydra Curl Cream with 2 members');
select t.ok((select count(*) from public.search_products('hyd')) = 3, '"hyd" finds the three approved hydrating products');
select t.ok((select count(*) from public.search_products('h')) = 0, 'one letter suggests nothing');
select t.ok((select count(*) from public.search_products('%')) = 0, 'a % sign is a letter, not a wildcard');
reset role;
set role anon;
select set_config('request.jwt.claims', '', false);
select t.ok((select count(*) from public.kit_products where member = :A) = 0, 'Community kit is hidden from visitors');
select t.ok((select count(*) from public.kit_products where member = :B) = 1, 'Everyone kit opens from a shared link');

-- ---------------------------------------------------------------- Moderators
reset role;
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select t.refused($$select public.merge_products((select id from public.products where name = 'Hydrating Leave In'), (select id from public.products where name = 'Hydrating Leave-In'))$$, 'a non-moderator merges products');
select t.refused($$select public.approve_product((select id from public.products where name = 'Flax Gel'))$$, 'a non-moderator approves a product');
select t.refused($$select public.turn_down_product((select id from public.products where name = 'Flax Gel'))$$, 'a non-moderator turns down a product');
reset role;
insert into public.staff (member, role) values (:B, 'moderator');
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select t.ok(exists (select 1 from public.products where name = 'Flax Gel'), 'a moderator sees pending products');
select t.refused($$select public.merge_products((select id from public.products where name = 'Hydrating Leave-In'), (select id from public.products where name = 'Flax Gel'))$$, 'merging into a pending product');
select public.merge_products((select id from public.products where name = 'Hydrating Leave In'), (select id from public.products where name = 'Hydrating Leave-In'));
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
select t.ok(exists (select 1 from public.kit_products k join public.products p on p.id = k.product_id
    where k.member = :A and p.name = 'Hydrating Leave-In')
  and not exists (select 1 from public.kit_products k join public.products p on p.id = k.product_id
    where p.name = 'Hydrating Leave In'), 'merging moves every kit to the kept product');
select t.ok(not exists (select 1 from public.search_products('hydrating') where name = 'Hydrating Leave In'), 'a merged duplicate is no longer suggested');
-- Turning down: A adds a product; the moderator turns it down; it leaves A's kit.
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
insert into public.products (brand, name, kind, added_by) values ('Kitchen Test', 'Glitter Paste', 'other', :A);
insert into public.kit_products (member, product_id) select :A, id from public.products where name = 'Glitter Paste';
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select t.refused($$select public.turn_down_product((select id from public.products where name = 'Hydra Curl Cream'))$$,
  'turning down an approved product');
select public.turn_down_product((select id from public.products where name = 'Glitter Paste'));
select t.ok(not exists (select 1 from public.products where name = 'Glitter Paste'), 'a turned-down product is gone');
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
select t.ok((select count(*) from public.kit_products where member = :A) = 3, 'a turned-down product leaves the kit, the rest stay');
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"}', false);
select public.approve_product((select id from public.products where name = 'Flax Gel'));
select set_config('request.jwt.claims', '{"sub":"dddddddd-dddd-dddd-dddd-dddddddddddd"}', false);
select t.ok(exists (select 1 from public.products where name = 'Flax Gel'), 'an approved product is visible to all');

-- ---------------------------------------------------------------- Delete account
reset role;
-- A adds one more pending product, then deletes the account.
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}', false);
insert into public.products (brand, name, kind, added_by) values ('Kitchen Test', 'Rice Water', 'other', :A);
select public.delete_my_account();
reset role;
select t.ok(not exists (select 1 from auth.users where id = :A), 'deleting removes the sign-in');
select t.ok(not exists (select 1 from public.profiles where id = :A), 'deleting removes the profile');
select t.ok(not exists (select 1 from public.members_private where id = :A), 'deleting removes the names');
select t.ok(not exists (select 1 from public.profile_items where member = :A), 'deleting removes card, scalp, heritage and kit settings');
select t.ok(not exists (select 1 from public.kit_products where member = :A), 'deleting removes the kit');
select t.ok(not exists (select 1 from public.kit_tools where member = :A), 'deleting removes the tools');
select t.ok(not exists (select 1 from public.products where name = 'Rice Water'), 'deleting removes the member''s pending products');
select t.ok(exists (select 1 from public.products where name = 'Flax Gel' and added_by is null),
  'approved products the member added stay, without their name on them');
select t.ok(exists (select 1 from public.kit_products where member = :B), 'other members'' kits are untouched');

\echo 'All server rule checks passed.'
