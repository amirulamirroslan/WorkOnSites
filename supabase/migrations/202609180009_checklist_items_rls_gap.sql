-- Phase 4/5 follow-up: checklist_template_items and task_checklist_items
-- had SELECT (and, for task_checklist_items, an assigned-worker UPDATE)
-- policies but no INSERT/DELETE policy at all — meaning the owner UI for
-- building a template, and copying a template's items onto a new task,
-- would both fail RLS with no way to write these rows. Same class of gap as
-- the exists-in-DB-no-UI issues found in the sibling WorkOnSite build.

create policy "template_items_write_owner" on checklist_template_items
  for insert with check (
    exists (select 1 from checklist_templates t where t.id = template_id and t.organization_id = current_org_id())
    and current_app_role() = 'owner'
  );

create policy "template_items_delete_owner" on checklist_template_items
  for delete using (
    exists (select 1 from checklist_templates t where t.id = template_id and t.organization_id = current_org_id())
    and current_app_role() = 'owner'
  );

create policy "template_items_update_owner" on checklist_template_items
  for update using (
    exists (select 1 from checklist_templates t where t.id = template_id and t.organization_id = current_org_id())
    and current_app_role() = 'owner'
  );

-- Task checklist items are populated once, at task-creation time, by
-- whoever is allowed to create the task in the first place.
create policy "task_items_insert_lead_or_owner" on task_checklist_items
  for insert with check (
    exists (
      select 1 from tasks t where t.id = task_id
      and t.organization_id = current_org_id()
      and current_app_role() in ('owner', 'team_leader')
    )
  );
