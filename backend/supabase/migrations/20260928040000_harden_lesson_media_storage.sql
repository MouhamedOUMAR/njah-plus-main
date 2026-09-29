BEGIN;

UPDATE storage.buckets
SET public = false
WHERE id IN ('lesson-videos', 'lesson-assets');

-- Media is delivered only by authenticated Next.js routes using short-lived
-- service-role signed URLs. Direct object reads must not be available.
DROP POLICY IF EXISTS "lesson-videos: allow signed URL reads" ON storage.objects;
DROP POLICY IF EXISTS "lesson-assets: allow signed URL reads" ON storage.objects;
DROP POLICY IF EXISTS "Auth users read lesson assets" ON storage.objects;

NOTIFY pgrst, 'reload schema';

COMMIT;
