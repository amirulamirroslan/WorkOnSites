-- Full reset for this Supabase project — drops every table, function,
-- and type that either the new WorkOnSite schema OR the older build
-- described in the original project summary may have created.
--
-- ⚠️ THIS DELETES ALL DATA in these tables. Only run this if you mean
-- to start the WorkOnSite schema completely from scratch in this
-- project. Uses CASCADE, so dependent constraints/policies/views on
-- any of these are dropped along with them automatically.

-- Views first (they can depend on tables below).
drop view if exists no_show_alerts cascade;

-- Tables from the new schema (0001–0003).
drop table if exists push_subscriptions cascade;
drop table if exists site_signoffs cascade;
drop table if exists public_holidays cascade;
drop table if exists announcements cascade;
drop table if exists supply_requests cascade;
drop table if exists incidents cascade;
drop table if exists leave_requests cascade;
drop table if exists shift_schedules cascade;
drop table if exists checklist_items cascade;
drop table if exists checklists cascade;
drop table if exists checklist_template_items cascade;
drop table if exists checklist_templates cascade;
drop table if exists shifts cascade;
drop table if exists site_assignments cascade;
drop table if exists sites cascade;
drop table if exists profiles cascade;
drop table if exists organizations cascade;

-- Tables that only existed in the OLDER build (per the original
-- project summary) — dropped here so they can't collide with
-- anything, even though the new schema never recreates them.
drop table if exists task_progress cascade;
drop table if exists shift_corrections cascade;
drop table if exists audit_log cascade;

-- Functions (both the current name and the pre-fix name, in case an
-- earlier attempt got further with a different working name before
-- landing on `app_current_role()`).
drop function if exists submit_site_signoff(uuid, text, text) cascade;
drop function if exists get_public_site_status(uuid) cascade;
drop function if exists generate_todays_checklist(uuid) cascade;
drop function if exists get_login_email(text) cascade;
drop function if exists is_assigned_site(uuid) cascade;
drop function if exists app_current_role() cascade;
drop function if exists current_org() cascade;

-- Custom type.
drop type if exists user_role cascade;

-- Storage: Supabase blocks direct DELETEs on storage.objects/buckets
-- from SQL (must go through the Storage API or dashboard instead), so
-- we can't drop the bucket here. Drop its policies (that's a normal
-- catalog operation, not a storage-table delete, so it's allowed) and
-- make sure the bucket itself is public via UPDATE, which also isn't
-- blocked. This also means 0001's `insert ... on conflict do nothing`
-- will just skip re-creating it — fine, since it's already public now.
drop policy if exists "shift-photos: public read" on storage.objects;
drop policy if exists "shift-photos: authenticated upload" on storage.objects;
update storage.buckets set public = true where id = 'shift-photos';

-- Optional: if you want the bucket fully emptied of old files too,
-- do that from the dashboard instead — Storage → shift-photos →
-- select all → Delete — since SQL can't do it directly.
