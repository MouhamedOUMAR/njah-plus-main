-- Restore the course thumbnail column expected by the student UI.
-- Safe for existing databases where the column is already present.

ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS thumbnail_url text;

NOTIFY pgrst, 'reload schema';
