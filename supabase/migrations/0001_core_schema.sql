-- WorkOnSite — core schema (MVP)
-- Organizations, profiles, sites, shifts, checklists.
-- Run this in the Supabase SQL editor, or via `supabase db push`.

-- ────────────────────────────────────────────────────────────
-- 1. Tables
-- ────────────────────────────────────────────────────────────

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  default_language text not null default 'en',
  created_at timestamptz not null default now()
);

create type user_role as enum ('owner', 'team_leader', 'janitor');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  role user_role not null,
  full_name text not null,
  username text unique, -- janitors log in with this instead of an email
  internal_email text unique, -- synthetic email backing the Supabase Auth account
  phone_number text,
  hourly_rate numeric(10, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  address text,
  lat double precision,
  lng double precision,
  radius_meters int not null default 100,
  created_at timestamptz not null default now()
);

create table site_assignments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (site_id, user_id)
);

create table shifts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  site_id uuid not null references sites (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed')),
  clock_in_at timestamptz not null default now(),
  clock_in_lat double precision,
  clock_in_lng double precision,
  clock_in_accuracy double precision,
  clock_in_photo_url text,
  clock_in_within_geofence boolean,
  clock_out_at timestamptz,
  clock_out_lat double precision,
  clock_out_lng double precision,
  clock_out_accuracy double precision,
  clock_out_photo_url text,
  clock_out_within_geofence boolean,
  handover_note text,
  created_at timestamptz not null default now()
);

create table checklist_templates (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table checklist_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references checklist_templates (id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create table checklists (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  template_id uuid references checklist_templates (id) on delete set null,
  checklist_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (site_id, checklist_date)
);

create table checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references checklists (id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'done')),
  completed_by uuid references profiles (id),
  completed_at timestamptz,
  before_photo_url text,
  after_photo_url text
);

-- ────────────────────────────────────────────────────────────
-- 2. Helper functions — SECURITY DEFINER from day one.
--    (An earlier version of this app made these regular functions,
--    which caused an infinite-recursion RLS error: the function's own
--    lookup re-triggered the policy that called it. Defining them as
--    SECURITY DEFINER breaks that loop.)
-- ────────────────────────────────────────────────────────────

create function current_org() returns uuid
language sql security definer stable
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

create function app_current_role() returns user_role
language sql security definer stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create function is_assigned_site(check_site_id uuid) returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (
    select 1 from site_assignments
    where site_id = check_site_id and user_id = auth.uid()
  );
$$;

-- Resolves a janitor's username to the synthetic email their Supabase
-- Auth account was created with, so the login form can accept a
-- username while Supabase Auth still signs in with email+password.
create function get_login_email(login_username text) returns text
language sql security definer stable
set search_path = public
as $$
  select internal_email from profiles where username = login_username;
$$;

-- Creates (or returns) today's checklist for a site from its template.
-- Runs as SECURITY DEFINER because a janitor calling this needs to
-- insert rows in `checklists`/`checklist_items`, which their own RLS
-- policies don't otherwise allow — so this function checks
-- authorization itself instead of relying on the caller's row access.
create function generate_todays_checklist(target_site_id uuid) returns uuid
language plpgsql security definer
set search_path = public
as $$
declare
  new_checklist_id uuid;
  active_template_id uuid;
begin
  if not is_assigned_site(target_site_id) and app_current_role() = 'janitor' then
    raise exception 'not authorized for this site';
  end if;

  select id into new_checklist_id
  from checklists
  where site_id = target_site_id and checklist_date = current_date;

  if new_checklist_id is not null then
    return new_checklist_id;
  end if;

  select id into active_template_id
  from checklist_templates
  where site_id = target_site_id
  order by created_at desc
  limit 1;

  insert into checklists (site_id, template_id, checklist_date)
  values (target_site_id, active_template_id, current_date)
  returning id into new_checklist_id;

  if active_template_id is not null then
    insert into checklist_items (checklist_id, label, sort_order)
    select new_checklist_id, label, sort_order
    from checklist_template_items
    where template_id = active_template_id
    order by sort_order;
  end if;

  return new_checklist_id;
end;
$$;

-- ────────────────────────────────────────────────────────────
-- 3. Row Level Security
-- ────────────────────────────────────────────────────────────

alter table organizations enable row level security;
alter table profiles enable row level security;
alter table sites enable row level security;
alter table site_assignments enable row level security;
alter table shifts enable row level security;
alter table checklist_templates enable row level security;
alter table checklist_template_items enable row level security;
alter table checklists enable row level security;
alter table checklist_items enable row level security;

-- organizations: members can read their own org; anyone can create one
-- during registration (the app creates the owner's profile right after).
create policy "org: members can read" on organizations
  for select using (id = current_org());
create policy "org: anyone can create during signup" on organizations
  for insert with check (true);

-- profiles: everyone in an org can see co-workers; owners/team leads can
-- manage them; a user can always read/update their own row.
create policy "profiles: read within org" on profiles
  for select using (organization_id = current_org());
create policy "profiles: self read before org lookup works" on profiles
  for select using (id = auth.uid());
create policy "profiles: self insert during signup" on profiles
  for insert with check (id = auth.uid());
create policy "profiles: owner/team_lead manage" on profiles
  for update using (
    organization_id = current_org() and app_current_role() in ('owner', 'team_leader')
  );

-- sites: readable by anyone assigned or by owner/team_lead in the org;
-- writable by owner/team_lead only.
create policy "sites: read" on sites
  for select using (
    organization_id = current_org()
    and (app_current_role() in ('owner', 'team_leader') or is_assigned_site(id))
  );
create policy "sites: write" on sites
  for insert with check (
    organization_id = current_org() and app_current_role() in ('owner', 'team_leader')
  );
create policy "sites: update" on sites
  for update using (
    organization_id = current_org() and app_current_role() in ('owner', 'team_leader')
  );

-- site_assignments: owner/team_lead manage; a janitor can see their own.
create policy "assignments: read own or managed" on site_assignments
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from sites s
      where s.id = site_id and s.organization_id = current_org()
      and app_current_role() in ('owner', 'team_leader')
    )
  );
create policy "assignments: manage" on site_assignments
  for all using (
    exists (
      select 1 from sites s
      where s.id = site_id and s.organization_id = current_org()
      and app_current_role() in ('owner', 'team_leader')
    )
  );

-- shifts: a janitor can read/create/close their own; owner/team_lead can
-- read all shifts at sites they manage.
create policy "shifts: self read" on shifts
  for select using (user_id = auth.uid());
create policy "shifts: managed read" on shifts
  for select using (
    organization_id = current_org() and app_current_role() in ('owner', 'team_leader')
  );
create policy "shifts: self clock in" on shifts
  for insert with check (user_id = auth.uid() and is_assigned_site(site_id));
create policy "shifts: self clock out" on shifts
  for update using (user_id = auth.uid());

-- checklist_templates / items: managed by owner/team_lead; readable by
-- anyone assigned to the site.
create policy "templates: read" on checklist_templates
  for select using (app_current_role() in ('owner', 'team_leader') or is_assigned_site(site_id));
create policy "templates: manage" on checklist_templates
  for all using (app_current_role() in ('owner', 'team_leader'));
create policy "template items: read" on checklist_template_items
  for select using (
    exists (select 1 from checklist_templates t where t.id = template_id)
  );
create policy "template items: manage" on checklist_template_items
  for all using (app_current_role() in ('owner', 'team_leader'));

-- checklists / checklist_items: readable + updatable by anyone assigned
-- to the site (janitors doing the work) or owner/team_lead.
create policy "checklists: read" on checklists
  for select using (app_current_role() in ('owner', 'team_leader') or is_assigned_site(site_id));
create policy "checklist items: read" on checklist_items
  for select using (
    exists (
      select 1 from checklists c
      where c.id = checklist_id
      and (app_current_role() in ('owner', 'team_leader') or is_assigned_site(c.site_id))
    )
  );
create policy "checklist items: update by assigned worker" on checklist_items
  for update using (
    exists (
      select 1 from checklists c
      where c.id = checklist_id and is_assigned_site(c.site_id)
    )
  );

-- ────────────────────────────────────────────────────────────
-- 4. Storage bucket for proof-of-presence and task photos.
--    Public so the app can build stable public URLs directly —
--    a private bucket with public-style URLs was the cause of every
--    broken photo in an earlier version of this app.
-- ────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('shift-photos', 'shift-photos', true)
on conflict (id) do nothing;

create policy "shift-photos: public read" on storage.objects
  for select using (bucket_id = 'shift-photos');
create policy "shift-photos: authenticated upload" on storage.objects
  for insert with check (bucket_id = 'shift-photos' and auth.role() = 'authenticated');
