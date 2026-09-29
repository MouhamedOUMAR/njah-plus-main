-- ============================================================
-- 20260428010000_restore_notes_history_downloads.sql
-- Restore notes, history, and downloads tables with RLS.
-- Also updates get_student_dashboard() to include counts.
-- ============================================================

-- ── 1. notes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id  uuid NOT NULL REFERENCES public.lessons(id)  ON DELETE CASCADE,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notes_user_id_idx    ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS notes_lesson_id_idx  ON public.notes(lesson_id);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notes_select_own"  ON public.notes;
DROP POLICY IF EXISTS "notes_insert_own"  ON public.notes;
DROP POLICY IF EXISTS "notes_delete_own"  ON public.notes;
DROP POLICY IF EXISTS "notes_admin_read"  ON public.notes;

CREATE POLICY "notes_select_own" ON public.notes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "notes_insert_own" ON public.notes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_delete_own" ON public.notes
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "notes_admin_read" ON public.notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 2. history ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id  uuid NOT NULL REFERENCES public.lessons(id)  ON DELETE CASCADE,
  viewed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS history_user_id_idx   ON public.history(user_id);
CREATE INDEX IF NOT EXISTS history_lesson_id_idx ON public.history(lesson_id);

ALTER TABLE public.history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "history_select_own"  ON public.history;
DROP POLICY IF EXISTS "history_upsert_own"  ON public.history;
DROP POLICY IF EXISTS "history_admin_read"  ON public.history;

CREATE POLICY "history_select_own" ON public.history
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "history_upsert_own" ON public.history
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "history_admin_read" ON public.history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 3. downloads ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.downloads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id       uuid NOT NULL REFERENCES public.lessons(id)  ON DELETE CASCADE,
  downloaded_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS downloads_user_id_idx   ON public.downloads(user_id);
CREATE INDEX IF NOT EXISTS downloads_lesson_id_idx ON public.downloads(lesson_id);

ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "downloads_select_own"  ON public.downloads;
DROP POLICY IF EXISTS "downloads_insert_own"  ON public.downloads;
DROP POLICY IF EXISTS "downloads_admin_read"  ON public.downloads;

CREATE POLICY "downloads_select_own" ON public.downloads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "downloads_insert_own" ON public.downloads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "downloads_admin_read" ON public.downloads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ── 4. Updated get_student_dashboard() with counts ───────────
DROP FUNCTION IF EXISTS public.get_student_dashboard();

CREATE OR REPLACE FUNCTION public.get_student_dashboard()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  uid    uuid := auth.uid();
  result json;
BEGIN
  IF uid IS NULL THEN
    RETURN json_build_object('error', 'not_authenticated');
  END IF;

  SELECT json_build_object(
    'user', json_build_object(
      'id',                      p.id,
      'full_name',               p.full_name,
      'role',                    p.role,
      'subscription_status',     p.subscription_status,
      'subscription_expires_at', p.subscription_expires_at,
      'is_active',               p.is_active
    ),
    'stats', json_build_object(
      'total_courses',   (SELECT COUNT(*) FROM public.courses),
      'total_lessons',   (SELECT COUNT(*) FROM public.lessons),
      'notes_count',     (SELECT COUNT(*) FROM public.notes     WHERE user_id = uid),
      'history_count',   (SELECT COUNT(*) FROM public.history   WHERE user_id = uid),
      'downloads_count', (SELECT COUNT(*) FROM public.downloads WHERE user_id = uid)
    )
  )
  INTO result
  FROM public.profiles p
  WHERE p.id = uid;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_dashboard() TO authenticated;

NOTIFY pgrst, 'reload schema';
