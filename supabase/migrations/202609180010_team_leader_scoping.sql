-- Team-leader/worker scoping. Previously "profiles_read_org" and
-- "attendance_read_org" let ANY org member read every profile and every
-- attendance record in the organization, regardless of role or site — an
-- owner needs that, but a team leader should only see people/records on
-- their own assigned sites, and a worker should only see their own.

create or replace function shares_a_site_with(other_worker_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from site_assignments mine
    join site_assignments theirs on theirs.site_id = mine.site_id
    where mine.worker_id = auth.uid()
      and theirs.worker_id = other_worker_id
      and mine.is_active
      and theirs.is_active
  );
$$;

-- profiles: replace the blanket org-wide read with a role-aware one.
drop policy if exists "profiles_read_org" on profiles;

create policy "profiles_read_scoped" on profiles
  for select using (
    organization_id = current_org_id()
    and (
      current_app_role() = 'owner'
      or id = auth.uid()
      or (current_app_role() = 'team_leader' and shares_a_site_with(id))
    )
  );

-- attendance_events: same idea — owner sees everything, team_leader sees
-- events for sites they're assigned to, worker sees only their own.
drop policy if exists "attendance_read_org" on attendance_events;

create policy "attendance_read_scoped" on attendance_events
  for select using (
    organization_id = current_org_id()
    and (
      current_app_role() = 'owner'
      or worker_id = auth.uid()
      or (
        current_app_role() = 'team_leader'
        and exists (
          select 1 from site_assignments sa
          where sa.site_id = attendance_events.site_id
          and sa.worker_id = auth.uid()
          and sa.is_active
        )
      )
    )
  );

-- Supervisor review for self-reported overrides: owner/team_leader (scoped
-- to their own sites, same as the read policy above) can update
-- attendance_events to set override_by, turning a worker's self-reported
-- exception into a reviewed one. No UPDATE policy existed on this table at
-- all before — override_by has been sitting unused in the schema.
create policy "attendance_update_override_review" on attendance_events
  for update using (
    organization_id = current_org_id()
    and (
      current_app_role() = 'owner'
      or (
        current_app_role() = 'team_leader'
        and exists (
          select 1 from site_assignments sa
          where sa.site_id = attendance_events.site_id
          and sa.worker_id = auth.uid()
          and sa.is_active
        )
      )
    )
  );
