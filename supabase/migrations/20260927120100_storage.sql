-- Photo storage.
--
-- project-photos (private): homeowners upload into a folder named after their user id,
--   e.g. "<uid>/<uuid>.jpg". A file is readable by its uploader and by anyone who can see a
--   project listing that file, so contractors see photos exactly as far as they see the project.
--   The app strips location data before upload and reads photos through short-lived signed URLs.
-- portfolio (public): contractors' before/after work, shown on their public storefronts.

insert into storage.buckets (id, name, public)
values ('project-photos', 'project-photos', false), ('portfolio', 'portfolio', true)
on conflict (id) do nothing;

create policy "project photos: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "project photos: read own or visible project" on storage.objects for select to authenticated
  using (
    bucket_id = 'project-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      -- projects is subject to its own RLS here, so this only matches projects the reader can see.
      or exists (select 1 from public.projects p where name = any (p.photos))
    )
  );

create policy "project photos: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'project-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "portfolio: contractors upload to own folder" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.my_contractor_id() is not null
  );

create policy "portfolio: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'portfolio' and (storage.foldername(name))[1] = auth.uid()::text);
