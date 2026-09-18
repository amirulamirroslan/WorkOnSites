-- Phase 4 + 5: Tasks and checklists

create type task_status as enum ('pending', 'in_progress', 'completed', 'blocked');

create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  version integer not null default 1,
  created_at timestamptz not null default now()
);

create table checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_templates(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  requires_photo boolean not null default false,
  is_required boolean not null default true
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  site_id uuid not null references sites(id),
  worker_id uuid not null references profiles(id),
  checklist_template_id uuid references checklist_templates(id),
  title text not null,
  status task_status not null default 'pending',
  scheduled_date date not null default current_date,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  template_item_id uuid references checklist_template_items(id),
  label text not null,
  sort_order integer not null default 0,
  requires_photo boolean not null default false,
  is_required boolean not null default true,
  is_completed boolean not null default false,
  completed_at timestamptz
);

alter table checklist_templates enable row level security;
alter table checklist_template_items enable row level security;
alter table tasks enable row level security;
alter table task_checklist_items enable row level security;

create policy "templates_read_org" on checklist_templates
  for select using (organization_id = current_org_id());
create policy "templates_write_owner" on checklist_templates
  for all using (organization_id = current_org_id() and current_app_role() = 'owner');

create policy "template_items_read_org" on checklist_template_items
  for select using (
    exists (select 1 from checklist_templates t where t.id = template_id and t.organization_id = current_org_id())
  );

create policy "tasks_read_org" on tasks
  for select using (organization_id = current_org_id());
create policy "tasks_write_self_or_lead" on tasks
  for update using (
    organization_id = current_org_id()
    and (worker_id = auth.uid() or current_app_role() in ('owner', 'team_leader'))
  );
create policy "tasks_insert_lead_or_owner" on tasks
  for insert with check (organization_id = current_org_id() and current_app_role() in ('owner', 'team_leader'));

create policy "task_items_read_org" on task_checklist_items
  for select using (
    exists (select 1 from tasks t where t.id = task_id and t.organization_id = current_org_id())
  );
create policy "task_items_update_assigned_worker" on task_checklist_items
  for update using (
    exists (
      select 1 from tasks t where t.id = task_id
      and t.organization_id = current_org_id()
      and (t.worker_id = auth.uid() or current_app_role() in ('owner', 'team_leader'))
    )
  );
