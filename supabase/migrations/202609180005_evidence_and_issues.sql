-- Phase 6: Evidence — photos and issues

create type issue_category as enum ('access_problem', 'equipment_damage', 'chemical_unavailable', 'safety_issue', 'other');
create type issue_status as enum ('open', 'acknowledged', 'resolved');

create table task_photos (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  task_checklist_item_id uuid references task_checklist_items(id),
  photo_url text not null,
  caption text,
  is_before boolean not null default false,
  uploaded_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

create table issues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  site_id uuid not null references sites(id),
  task_id uuid references tasks(id),
  reported_by uuid not null references profiles(id),
  category issue_category not null,
  description text not null,
  photo_url text,
  status issue_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table task_photos enable row level security;
alter table issues enable row level security;

create policy "photos_read_org" on task_photos
  for select using (
    exists (select 1 from tasks t where t.id = task_id and t.organization_id = current_org_id())
  );
create policy "photos_insert_assigned_worker" on task_photos
  for insert with check (
    exists (
      select 1 from tasks t where t.id = task_id
      and t.organization_id = current_org_id()
      and (t.worker_id = auth.uid() or current_role() in ('owner', 'team_leader'))
    )
  );

create policy "issues_read_org" on issues
  for select using (organization_id = current_org_id());
create policy "issues_insert_org" on issues
  for insert with check (organization_id = current_org_id());
create policy "issues_update_lead_or_owner" on issues
  for update using (organization_id = current_org_id() and current_role() in ('owner', 'team_leader'));
