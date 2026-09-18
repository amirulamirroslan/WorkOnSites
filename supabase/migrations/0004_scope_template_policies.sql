-- WorkOnSite — close a latent RLS gap: the "manage" policies on
-- checklist_templates and checklist_template_items checked the
-- caller's role but never that the site (and therefore the template)
-- actually belongs to their organization. Harmless with a single
-- organization, but wrong in principle and worth closing before
-- multi-org support is ever added.
-- Run after 0003_verification_and_prefs.sql.

drop policy "templates: manage" on checklist_templates;
create policy "templates: manage" on checklist_templates
  for all using (
    app_current_role() in ('owner', 'team_leader')
    and exists (
      select 1 from sites s where s.id = site_id and s.organization_id = current_org()
    )
  );

drop policy "template items: manage" on checklist_template_items;
create policy "template items: manage" on checklist_template_items
  for all using (
    app_current_role() in ('owner', 'team_leader')
    and exists (
      select 1 from checklist_templates t
      join sites s on s.id = t.site_id
      where t.id = template_id and s.organization_id = current_org()
    )
  );
