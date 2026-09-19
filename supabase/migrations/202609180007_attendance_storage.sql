-- Phase 3 follow-up: storage bucket for attendance clock-in photos
-- (face/photo capture for attendance verification — NOT facial recognition,
-- per spec §75 rule 13).

insert into storage.buckets (id, name, public)
values ('attendance-photos', 'attendance-photos', false)
on conflict (id) do nothing;

-- Folder convention: <auth.uid()>/<timestamp>.jpg — each user can only
-- write into their own folder, and org members can read any attendance
-- photo belonging to their organization (checked via the attendance_events
-- row itself once inserted; for the upload step we only need "it's their
-- own folder").
create policy "attendance_photos_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'attendance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attendance_photos_read_own" on storage.objects
  for select using (
    bucket_id = 'attendance-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "attendance_photos_read_org_admins" on storage.objects
  for select using (
    bucket_id = 'attendance-photos'
    and current_app_role() in ('owner', 'team_leader')
  );
