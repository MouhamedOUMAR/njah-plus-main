-- Public course thumbnail bucket.
-- Upload URLs are created by an admin-only server route using the service role.
-- Public reads let student pages display thumbnails without signed URLs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-thumbnails',
  'course-thumbnails',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'course-thumbnails: public read'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "course-thumbnails: public read"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'course-thumbnails')
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'course-thumbnails: admin insert'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "course-thumbnails: admin insert"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'course-thumbnails' AND public.is_admin())
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'course-thumbnails: admin update'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "course-thumbnails: admin update"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'course-thumbnails' AND public.is_admin())
      WITH CHECK (bucket_id = 'course-thumbnails' AND public.is_admin())
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'course-thumbnails: admin delete'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "course-thumbnails: admin delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'course-thumbnails' AND public.is_admin())
    $policy$;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
