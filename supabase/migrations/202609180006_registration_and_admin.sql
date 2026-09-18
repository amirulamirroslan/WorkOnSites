-- Phase 1 follow-up: self-service owner registration + admin-created team
-- members (team leaders / workers), matching the "owner adds staff, staff
-- don't self-signup" model from PHASE1_PLAN.md.

-- Any signed-in user can create a brand-new organization (this is the org
-- created during owner registration). Nothing else references it yet, so
-- there's no privilege-escalation risk in allowing this broadly.
create policy "org_insert_authenticated" on organizations
  for insert with check (auth.uid() is not null);

-- Bootstrap case: a freshly signed-up user may insert THEIR OWN profile as
-- 'owner', but only for an organization that has zero profiles yet (i.e.
-- the org they just created above, not an existing one). This is what lets
-- registration work without a chicken-and-egg "you must be an owner to
-- insert a profile" deadlock, while still preventing anyone from declaring
-- themselves owner of an org that already has people in it.
create policy "profiles_insert_self_bootstrap_owner" on profiles
  for insert with check (
    id = auth.uid()
    and role = 'owner'
    and not exists (select 1 from profiles p where p.organization_id = profiles.organization_id)
  );

-- username used to sign in team leaders/workers created without a real
-- email address (create-team-member Edge Function synthesizes
-- "<username>@workonsite.internal" as their auth email).
alter table profiles add column username text unique;
