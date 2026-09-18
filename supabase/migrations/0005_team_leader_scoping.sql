-- WorkOnSite — team_leader site scoping
-- Every "owner/team_leader" policy up to this point treated the two
-- roles identically, giving team leaders full organization-wide access.
-- The original spec calls for team_leader to be scoped to their
-- assigned sites only, with owner keeping full org access. This
-- migration rewrites every affected policy to reflect that split.
-- Run after 0004_scope_template_policies.sql.

-- ────────────────────────────────────────────────────────────
-- sites
-- ────────────────────────────────────────────────────────────

drop policy "sites: read" on sites;
create policy "sites: read" on sites
  for select using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(id))
  );

-- Creating a new site is an org-structure decision — owner only.
drop policy "sites: write" on sites;
create policy "sites: write" on sites
  for insert with check (
    organization_id = current_org() and app_current_role() = 'owner'
  );

-- A team_leader can edit a site they're assigned to (geofence radius,
-- verification link); an owner can edit any site in the org.
drop policy "sites: update" on sites;
create policy "sites: update" on sites
  for update using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(id))
  );

-- ────────────────────────────────────────────────────────────
-- site_assignments
-- ────────────────────────────────────────────────────────────

drop policy "assignments: read own or managed" on site_assignments;
create policy "assignments: read own or managed" on site_assignments
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from sites s
      where s.id = site_id and s.organization_id = current_org()
      and (app_current_role() = 'owner' or is_assigned_site(s.id))
    )
  );

drop policy "assignments: manage" on site_assignments;
create policy "assignments: manage" on site_assignments
  for all using (
    exists (
      select 1 from sites s
      where s.id = site_id and s.organization_id = current_org()
      and (app_current_role() = 'owner' or is_assigned_site(s.id))
    )
  );

-- ────────────────────────────────────────────────────────────
-- shifts
-- ────────────────────────────────────────────────────────────

drop policy "shifts: managed read" on shifts;
create policy "shifts: managed read" on shifts
  for select using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

-- ────────────────────────────────────────────────────────────
-- checklist_templates / checklist_template_items
-- (0004 already added organization scoping; this layers the
-- team_leader-vs-owner split on top of it)
-- ────────────────────────────────────────────────────────────

drop policy "templates: read" on checklist_templates;
create policy "templates: read" on checklist_templates
  for select using (app_current_role() = 'owner' or is_assigned_site(site_id));

drop policy "templates: manage" on checklist_templates;
create policy "templates: manage" on checklist_templates
  for all using (
    exists (select 1 from sites s where s.id = site_id and s.organization_id = current_org())
    and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

drop policy "template items: read" on checklist_template_items;
create policy "template items: read" on checklist_template_items
  for select using (
    exists (
      select 1 from checklist_templates t
      where t.id = template_id and (app_current_role() = 'owner' or is_assigned_site(t.site_id))
    )
  );

drop policy "template items: manage" on checklist_template_items;
create policy "template items: manage" on checklist_template_items
  for all using (
    exists (
      select 1 from checklist_templates t
      join sites s on s.id = t.site_id
      where t.id = template_id and s.organization_id = current_org()
      and (app_current_role() = 'owner' or is_assigned_site(t.site_id))
    )
  );

-- ────────────────────────────────────────────────────────────
-- checklists / checklist_items
-- ────────────────────────────────────────────────────────────

drop policy "checklists: read" on checklists;
create policy "checklists: read" on checklists
  for select using (app_current_role() = 'owner' or is_assigned_site(site_id));

drop policy "checklist items: read" on checklist_items;
create policy "checklist items: read" on checklist_items
  for select using (
    exists (
      select 1 from checklists c
      where c.id = checklist_id and (app_current_role() = 'owner' or is_assigned_site(c.site_id))
    )
  );

-- ────────────────────────────────────────────────────────────
-- leave_requests — no site_id column, so scope via a shared site
-- between the requesting worker and the team leader.
-- ────────────────────────────────────────────────────────────

drop policy "leave: managed read" on leave_requests;
create policy "leave: managed read" on leave_requests
  for select using (
    organization_id = current_org() and (
      app_current_role() = 'owner'
      or exists (
        select 1 from site_assignments sa_worker
        join site_assignments sa_lead on sa_lead.site_id = sa_worker.site_id
        where sa_worker.user_id = leave_requests.user_id and sa_lead.user_id = auth.uid()
      )
    )
  );

drop policy "leave: managed decide" on leave_requests;
create policy "leave: managed decide" on leave_requests
  for update using (
    organization_id = current_org() and (
      app_current_role() = 'owner'
      or exists (
        select 1 from site_assignments sa_worker
        join site_assignments sa_lead on sa_lead.site_id = sa_worker.site_id
        where sa_worker.user_id = leave_requests.user_id and sa_lead.user_id = auth.uid()
      )
    )
  );

-- ────────────────────────────────────────────────────────────
-- incidents / supply_requests — already have site_id directly
-- ────────────────────────────────────────────────────────────

drop policy "incidents: managed read" on incidents;
create policy "incidents: managed read" on incidents
  for select using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

drop policy "incidents: managed resolve" on incidents;
create policy "incidents: managed resolve" on incidents
  for update using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

drop policy "supplies: managed read" on supply_requests;
create policy "supplies: managed read" on supply_requests
  for select using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

drop policy "supplies: managed fulfill" on supply_requests;
create policy "supplies: managed fulfill" on supply_requests
  for update using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

-- ────────────────────────────────────────────────────────────
-- shift_schedules
-- ────────────────────────────────────────────────────────────

drop policy "schedules: managed read" on shift_schedules;
create policy "schedules: managed read" on shift_schedules
  for select using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

drop policy "schedules: manage" on shift_schedules;
create policy "schedules: manage" on shift_schedules
  for insert with check (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

drop policy "schedules: update" on shift_schedules;
create policy "schedules: update" on shift_schedules
  for update using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

drop policy "schedules: delete" on shift_schedules;
create policy "schedules: delete" on shift_schedules
  for delete using (
    organization_id = current_org() and (app_current_role() = 'owner' or is_assigned_site(site_id))
  );

-- ────────────────────────────────────────────────────────────
-- announcements — a team_leader can only post to a site they're
-- assigned to; org-wide (site_id null) announcements are owner-only.
-- ────────────────────────────────────────────────────────────

drop policy "announcements: post" on announcements;
create policy "announcements: post" on announcements
  for insert with check (
    organization_id = current_org() and (
      app_current_role() = 'owner'
      or (app_current_role() = 'team_leader' and site_id is not null and is_assigned_site(site_id))
    )
  );

-- ────────────────────────────────────────────────────────────
-- profiles — a team_leader can only activate/deactivate a worker who
-- shares at least one site with them; owner can manage anyone.
-- ────────────────────────────────────────────────────────────

drop policy "profiles: owner/team_lead manage" on profiles;
create policy "profiles: owner/team_lead manage" on profiles
  for update using (
    organization_id = current_org() and (
      app_current_role() = 'owner'
      or exists (
        select 1 from site_assignments sa_worker
        join site_assignments sa_lead on sa_lead.site_id = sa_worker.site_id
        where sa_worker.user_id = profiles.id and sa_lead.user_id = auth.uid()
      )
    )
  );
