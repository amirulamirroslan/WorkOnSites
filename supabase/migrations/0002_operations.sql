-- WorkOnSite — operations schema (scheduling, requests, announcements)
-- Run after 0001_core_schema.sql.

create table shift_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  site_id uuid not null references sites (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  scheduled_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  unique (user_id, scheduled_date)
);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  decided_by uuid references profiles (id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  site_id uuid not null references sites (id) on delete cascade,
  reported_by uuid not null references profiles (id) on delete cascade,
  severity text not null default 'low' check (severity in ('low', 'medium', 'high')),
  description text not null,
  photo_url text,
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now()
);

create table supply_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  site_id uuid not null references sites (id) on delete cascade,
  requested_by uuid not null references profiles (id) on delete cascade,
  item text not null,
  quantity int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'fulfilled')),
  created_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  site_id uuid references sites (id) on delete cascade, -- null = org-wide
  posted_by uuid not null references profiles (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table shift_schedules enable row level security;
alter table leave_requests enable row level security;
alter table incidents enable row level security;
alter table supply_requests enable row level security;
alter table announcements enable row level security;

-- shift_schedules: owner/team_lead manage; a worker reads their own.
create policy "schedules: self read" on shift_schedules
  for select using (user_id = auth.uid());
create policy "schedules: managed read" on shift_schedules
  for select using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));
create policy "schedules: manage" on shift_schedules
  for insert with check (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));
create policy "schedules: update" on shift_schedules
  for update using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));
create policy "schedules: delete" on shift_schedules
  for delete using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));

-- leave_requests: a worker manages their own; owner/team_lead read+decide all in org.
create policy "leave: self manage" on leave_requests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "leave: managed read" on leave_requests
  for select using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));
create policy "leave: managed decide" on leave_requests
  for update using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));

-- incidents: reporter + assigned-site workers can create/read; owner/team_lead read+resolve all.
create policy "incidents: create" on incidents
  for insert with check (reported_by = auth.uid() and is_assigned_site(site_id));
create policy "incidents: self read" on incidents
  for select using (reported_by = auth.uid());
create policy "incidents: managed read" on incidents
  for select using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));
create policy "incidents: managed resolve" on incidents
  for update using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));

-- supply_requests: same shape as incidents.
create policy "supplies: create" on supply_requests
  for insert with check (requested_by = auth.uid() and is_assigned_site(site_id));
create policy "supplies: self read" on supply_requests
  for select using (requested_by = auth.uid());
create policy "supplies: managed read" on supply_requests
  for select using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));
create policy "supplies: managed fulfill" on supply_requests
  for update using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));

-- announcements: owner/team_lead post; readable by anyone in the org (org-wide) or
-- assigned to the site (site-scoped).
create policy "announcements: read" on announcements
  for select using (
    organization_id = current_org()
    and (site_id is null or app_current_role() in ('owner', 'team_leader') or is_assigned_site(site_id))
  );
create policy "announcements: post" on announcements
  for insert with check (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));

create table public_holidays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  holiday_date date not null,
  name text not null,
  unique (organization_id, holiday_date)
);
alter table public_holidays enable row level security;
create policy "holidays: read" on public_holidays
  for select using (organization_id = current_org());
create policy "holidays: manage" on public_holidays
  for all using (organization_id = current_org() and app_current_role() in ('owner', 'team_leader'));

-- No-show detection: a scheduled shift with no matching open/closed shift 30+
-- minutes past its start time. Exposed as a view rather than a stored flag,
-- so it's always live and never goes stale.
create view no_show_alerts as
select
  ss.id as schedule_id,
  ss.organization_id,
  ss.site_id,
  ss.user_id,
  ss.scheduled_date,
  ss.start_time
from shift_schedules ss
where not exists (
  select 1 from shifts s
  where s.user_id = ss.user_id
  and s.site_id = ss.site_id
  and s.clock_in_at::date = ss.scheduled_date
)
and not exists (
  select 1 from public_holidays ph
  where ph.organization_id = ss.organization_id and ph.holiday_date = ss.scheduled_date
)
and (ss.scheduled_date + ss.start_time + interval '30 minutes') < now();
