BEGIN;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS license_year text DEFAULT 'L1',
  ADD COLUMN IF NOT EXISTS semester text DEFAULT 'S1';

-- Existing courses remain available and start in L1/S1 until an admin reclassifies them.
UPDATE public.courses
SET license_year = 'L1'
WHERE license_year IS NULL OR license_year NOT IN ('L1', 'L2', 'L3');

UPDATE public.courses
SET semester = CASE license_year
  WHEN 'L1' THEN 'S1'
  WHEN 'L2' THEN 'S3'
  WHEN 'L3' THEN 'S5'
END
WHERE semester IS NULL
   OR NOT (
     (license_year = 'L1' AND semester IN ('S1', 'S2')) OR
     (license_year = 'L2' AND semester IN ('S3', 'S4')) OR
     (license_year = 'L3' AND semester IN ('S5', 'S6'))
   );

ALTER TABLE public.courses
  ALTER COLUMN license_year SET DEFAULT 'L1',
  ALTER COLUMN license_year SET NOT NULL,
  ALTER COLUMN semester SET DEFAULT 'S1',
  ALTER COLUMN semester SET NOT NULL;

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_license_year_check,
  DROP CONSTRAINT IF EXISTS courses_semester_check,
  DROP CONSTRAINT IF EXISTS courses_license_semester_match;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_license_year_check
    CHECK (license_year IN ('L1', 'L2', 'L3')),
  ADD CONSTRAINT courses_semester_check
    CHECK (semester IN ('S1', 'S2', 'S3', 'S4', 'S5', 'S6')),
  ADD CONSTRAINT courses_license_semester_match
    CHECK (
      (license_year = 'L1' AND semester IN ('S1', 'S2')) OR
      (license_year = 'L2' AND semester IN ('S3', 'S4')) OR
      (license_year = 'L3' AND semester IN ('S5', 'S6'))
    );

CREATE INDEX IF NOT EXISTS courses_license_semester_idx
  ON public.courses (license_year, semester);

CREATE OR REPLACE FUNCTION public.get_student_course_detail(p_course_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid           uuid        := auth.uid();
  v_is_active   boolean     := false;
  v_role        text        := null;
  v_sub_status  text        := 'none';
  v_sub_expires timestamptz := null;
  v_has_sub     boolean     := false;
  result        json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM courses WHERE id = p_course_id) THEN
    RETURN NULL;
  END IF;

  IF uid IS NOT NULL THEN
    SELECT is_active, role, subscription_status, subscription_expires_at
    INTO v_is_active, v_role, v_sub_status, v_sub_expires
    FROM profiles
    WHERE id = uid;

    v_has_sub := public.has_active_subscription(uid);
  END IF;

  SELECT json_build_object(
    'course', json_build_object(
      'id',             c.id,
      'title',          c.title,
      'description',    c.description,
      'thumbnail_url',  c.thumbnail_url,
      'category',       c.category,
      'license_year',   c.license_year,
      'semester',       c.semester,
      'total_duration', c.total_duration,
      'is_published',   c.is_published
    ),
    'lessons', (
      SELECT json_agg(
        jsonb_build_object(
          'id',              l.id,
          'course_id',       l.course_id,
          'title',           l.title,
          'description',     l.description,
          'video_type',      l.video_type,
          'duration',        l.duration,
          'order_index',     l.order_index,
          'is_downloadable', l.is_downloadable,
          'is_protected',    l.is_protected,
          'can_access', CASE
            WHEN uid IS NULL                      THEN false
            WHEN NOT coalesce(v_is_active, false) THEN false
            WHEN v_role = 'admin'                 THEN true
            WHEN NOT l.is_protected               THEN true
            WHEN v_has_sub                        THEN true
            ELSE false
          END,
          'lock_reason', CASE
            WHEN uid IS NULL                      THEN 'not_authenticated'
            WHEN NOT coalesce(v_is_active, false) THEN 'inactive_account'
            WHEN NOT l.is_protected               THEN NULL
            WHEN v_has_sub                        THEN NULL
            ELSE 'subscription_required'
          END
        )
        ORDER BY l.order_index
      )
      FROM lessons l
      WHERE l.course_id = p_course_id
    )
  )
  INTO result
  FROM courses c
  WHERE c.id = p_course_id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_course_detail(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
