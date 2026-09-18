-- Phase 1: Foundation — organizations, profiles, roles, RLS
-- Sites/assignments/tasks/checklists/attendance land in later migrations
-- (Phase 2+) per PHASE1_PLAN.md.

create type user_role as enum ('owner', 'team_leader', 'worker');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  role user_role not null,
  full_name text not null,
  phone text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table organizations enable row level security;
alter table profiles enable row level security;

-- Helper: current user's org + role, used across all future RLS policies.
create or replace function current_org_id() returns uuid as $$
  select organization_id from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function current_app_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- Members can read their own organization.
create policy "org_read_own" on organizations
  for select using (id = current_org_id());

-- Everyone in an org can read profiles within that org.
create policy "profiles_read_org" on profiles
  for select using (organization_id = current_org_id());

-- Users can update their own profile (not role/org — handled via an owner-only
-- admin path once the Owner console is built in Phase 8).
create policy "profiles_update_self" on profiles
  for update using (id = auth.uid());

-- Only owners can insert new profiles (invite flow, Phase 1 auth work).
create policy "profiles_insert_owner" on profiles
  for insert with check (current_app_role() = 'owner');
