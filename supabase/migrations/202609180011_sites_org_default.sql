-- Safety net: sites.organization_id is NOT NULL and the RLS check requires it
-- to equal the caller's org. Default it server-side so an insert that omits it
-- (as the Add Site form did) resolves to the signed-in owner's organization
-- instead of failing with "new row violates row-level security policy".
alter table sites alter column organization_id set default current_org_id();

-- Explicit WITH CHECK (the original "for all" policy relied on USING alone).
drop policy if exists "sites_write_owner" on sites;
create policy "sites_write_owner" on sites
  for all
  using (organization_id = current_org_id() and current_app_role() = 'owner')
  with check (organization_id = current_org_id() and current_app_role() = 'owner');
