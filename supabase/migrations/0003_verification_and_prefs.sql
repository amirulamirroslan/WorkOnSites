-- WorkOnSite — client verification, language preference, push subscriptions
-- Run after 0002_operations.sql.

alter table sites add column public_share_token uuid not null default gen_random_uuid();
alter table sites add column client_verification_enabled boolean not null default false;
alter table profiles add column preferred_language text not null default 'en'
  check (preferred_language in ('en', 'ms', 'id'));

create table site_signoffs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  signed_off_date date not null default current_date,
  signer_name text,
  signer_note text,
  created_at timestamptz not null default now(),
  unique (site_id, signed_off_date)
);
alter table site_signoffs enable row level security;

-- No general policy grants anon access to `sites`, `checklists`, or
-- `site_signoffs` — the public verification page never queries those
-- tables directly. It only ever calls the two functions below, each of
-- which checks the token itself before returning or writing anything,
-- so an anon key can't be used to browse sites or checklists that
-- don't belong to the link the client was actually given.

create function get_public_site_status(token uuid) returns table (
  site_name text,
  checklist_date date,
  total_items int,
  completed_items int,
  already_signed_off boolean
)
language plpgsql security definer stable
set search_path = public
as $$
declare
  target_site record;
  target_checklist record;
begin
  select id, name into target_site
  from sites
  where public_share_token = token and client_verification_enabled = true;

  if target_site.id is null then
    return;
  end if;

  select id into target_checklist
  from checklists
  where site_id = target_site.id and checklist_date = current_date;

  return query
  select
    target_site.name,
    current_date,
    coalesce((select count(*)::int from checklist_items where checklist_id = target_checklist.id), 0),
    coalesce((select count(*)::int from checklist_items where checklist_id = target_checklist.id and status = 'done'), 0),
    exists (
      select 1 from site_signoffs
      where site_id = target_site.id and signed_off_date = current_date
    );
end;
$$;

create function submit_site_signoff(token uuid, signer_name text, signer_note text) returns boolean
language plpgsql security definer
set search_path = public
as $$
declare
  target_site_id uuid;
begin
  select id into target_site_id
  from sites
  where public_share_token = token and client_verification_enabled = true;

  if target_site_id is null then
    return false;
  end if;

  insert into site_signoffs (site_id, signer_name, signer_note)
  values (target_site_id, signer_name, signer_note)
  on conflict (site_id, signed_off_date) do update
    set signer_name = excluded.signer_name, signer_note = excluded.signer_note;

  return true;
end;
$$;

-- Owner/team_lead still read sign-off history normally, through RLS.
create policy "signoffs: org read" on site_signoffs
  for select using (
    exists (select 1 from sites s where s.id = site_id and s.organization_id = current_org())
  );

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
create policy "push: self manage" on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
