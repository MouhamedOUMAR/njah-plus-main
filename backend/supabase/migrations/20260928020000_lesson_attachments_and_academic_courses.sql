BEGIN;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS attachment_bucket text,
  ADD COLUMN IF NOT EXISTS attachment_path text,
  ADD COLUMN IF NOT EXISTS attachment_type text,
  ADD COLUMN IF NOT EXISTS attachment_name text;

ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_attachment_type_check;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_attachment_type_check
    CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'pdf'));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-assets',
  'lesson-assets',
  false,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Files are delivered only through /api/lesson-attachment after access checks.
DROP POLICY IF EXISTS "Auth users read lesson assets" ON storage.objects;
DROP POLICY IF EXISTS "lesson-assets: allow signed URL reads" ON storage.objects;

-- Remove only the legacy demonstration catalogue. Real admin-created courses remain.
DELETE FROM public.courses
WHERE lower(btrim(title)) IN (
  'grammaire essentielle',
  'vocabulaire bac',
  'expression orale'
)
OR lower(btrim(title)) LIKE 'compr_hension _crite';

-- Academic year and semester are now the only course classification.
UPDATE public.courses SET category = NULL WHERE category IS NOT NULL;

NOTIFY pgrst, 'reload schema';

COMMIT;
