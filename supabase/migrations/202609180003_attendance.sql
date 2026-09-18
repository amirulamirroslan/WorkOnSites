-- Phase 3: Attendance — clock in/out with location + photo verification

create type attendance_event_type as enum ('clock_in', 'clock_out');
create type verification_status as enum ('verified', 'out_of_range', 'exception_override');

create table attendance_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  site_id uuid not null references sites(id),
  worker_id uuid not null references profiles(id),
  event_type attendance_event_type not null,
  occurred_at timestamptz not null default now(),
  latitude double precision not null,
  longitude double precision not null,
  gps_accuracy_m double precision,
  distance_from_site_m double precision not null,
  verification_status verification_status not null,
  capture_photo_url text, -- face/photo capture, NOT facial recognition (spec §75 rule 13)
  device_info text,
  override_reason text, -- required when verification_status = 'exception_override'
  override_by uuid references profiles(id),
  synced_offline boolean not null default false,
  created_at timestamptz not null default now()
);

alter table attendance_events enable row level security;

create policy "attendance_read_org" on attendance_events
  for select using (organization_id = current_org_id());

create policy "attendance_insert_self" on attendance_events
  for insert with check (
    organization_id = current_org_id()
    and (worker_id = auth.uid() or current_app_role() in ('owner', 'team_leader'))
  );
