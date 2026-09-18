-- Grants admins access to the `results` table, which previously had zero
-- policies for anyone but students (their own, published-only rows). That
-- meant the Admin -> Results page's "pending publication" query always
-- came back empty under RLS (not an error — just silently zero rows), and
-- publishing (an UPDATE) would have been blocked too. Report cards, which
-- also read straight from `results`, were affected the same way.
--
-- Note: at the time this was applied, the live database already had a
-- `teachers_read_own_results` policy that this repo's schema.sql didn't
-- reflect (see repo housekeeping note) — teachers already had it; admins
-- did not.
create policy admin_manage_results on results
  for all using (current_role_is('super_admin'));
