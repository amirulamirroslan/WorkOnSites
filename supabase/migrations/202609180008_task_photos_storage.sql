-- Storage bucket for task checklist photo evidence (before/after shots),
-- mirroring the attendance-photos setup in 202609180007.

insert into storage.buckets (id, name, public)
values ('task-photos', 'task-photos', false)
on conflict (id) do nothing;

create policy "task_photos_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'task-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "task_photos_read_own" on storage.objects
  for select using (
    bucket_id = 'task-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "task_photos_read_org_admins" on storage.objects
  for select using (
    bucket_id = 'task-photos'
    and current_app_role() in ('owner', 'team_leader')
  );
