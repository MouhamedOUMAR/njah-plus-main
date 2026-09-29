-- Add/restore favorites to support favoriting courses and individual lessons.
-- This migration is intentionally idempotent because some environments were
-- missing public.favorites entirely while the frontend already used it.
CREATE TABLE IF NOT EXISTS public.favorites (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id  uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id  uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.favorites
ADD COLUMN IF NOT EXISTS lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE;

-- Update unique constraint: 
-- A user can favorite a course (lesson_id IS NULL)
-- A user can favorite many lessons in the same course, so unique is (user_id, lesson_id)
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_course_id_key;

-- Remove any old duplicate rows before unique indexes are created.
WITH ranked_course_favorites AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, course_id
      ORDER BY created_at DESC, id DESC
    ) AS row_number
  FROM public.favorites
  WHERE lesson_id IS NULL
)
DELETE FROM public.favorites favorites
USING ranked_course_favorites ranked
WHERE favorites.id = ranked.id
  AND ranked.row_number > 1;

WITH ranked_lesson_favorites AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, lesson_id
      ORDER BY created_at DESC, id DESC
    ) AS row_number
  FROM public.favorites
  WHERE lesson_id IS NOT NULL
)
DELETE FROM public.favorites favorites
USING ranked_lesson_favorites ranked
WHERE favorites.id = ranked.id
  AND ranked.row_number > 1;

CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_course_id_idx ON public.favorites(course_id);
CREATE INDEX IF NOT EXISTS favorites_lesson_id_idx ON public.favorites(lesson_id);

-- Unique (user, course) for course favorites
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_course_idx ON public.favorites (user_id, course_id) WHERE (lesson_id IS NULL);

-- Unique (user, lesson) for lesson favorites
CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_lesson_idx ON public.favorites (user_id, lesson_id) WHERE (lesson_id IS NOT NULL);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own favorites" ON public.favorites;
CREATE POLICY "Users manage own favorites" ON public.favorites
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

NOTIFY pgrst, 'reload schema';
