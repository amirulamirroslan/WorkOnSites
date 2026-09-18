-- Phase 2: Sites, geofence, worker assignments

create table sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  geofence_radius_m integer not null default 50,
  created_at timestamptz not null default now()
);

create table site_assignments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  worker_id uuid not null references profiles(id) on delete cascade,
  team_leader_id uuid references profiles(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (site_id, worker_id)
);

alter table sites enable row level security;
alter table site_assignments enable row level security;

create policy "sites_read_org" on sites
  for select using (organization_id = current_org_id());

create policy "sites_write_owner" on sites
  for all using (organization_id = current_org_id() and current_app_role() = 'owner');

create policy "assignments_read_org" on site_assignments
  for select using (
    exists (select 1 from sites s where s.id = site_id and s.organization_id = current_org_id())
  );

create policy "assignments_write_lead_or_owner" on site_assignments
  for all using (
    current_app_role() in ('owner', 'team_leader')
    and exists (select 1 from sites s where s.id = site_id and s.organization_id = current_org_id())
  );
