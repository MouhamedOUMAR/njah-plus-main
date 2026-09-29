-- ============================================================
-- 20260430020000_get_student_course_detail_final.sql
-- Definitive single-param RPC for course detail.
-- Drops every possible old signature first so there is no
-- overload ambiguity in the schema cache.
-- ============================================================

-- Drop every signature that may exist from prior migrations
DROP FUNCTION IF EXISTS public.get_student_course_detail(uuid, text);
DROP FUNCTION IF EXISTS public.get_student_course_detail(uuid, uuid);
DROP FUNCTION IF EXISTS public.get_student_course_detail(uuid);

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
  -- Return null if the course doesn't exist
  IF NOT EXISTS (SELECT 1 FROM courses WHERE id = p_course_id) THEN
    RETURN NULL;
  END IF;

  -- Load the caller's profile when authenticated
  IF uid IS NOT NULL THEN
    SELECT is_active, role, subscription_status, subscription_expires_at
    INTO v_is_active, v_role, v_sub_status, v_sub_expires
    FROM profiles
    WHERE id = uid;

    v_has_sub := (v_sub_status = 'active')
      AND (v_sub_expires IS NULL OR v_sub_expires > now());
  END IF;

  SELECT json_build_object(
    'course', json_build_object(
      'id',             c.id,
      'title',          c.title,
      'description',    c.description,
      'category',       c.category,
      'level',          c.level,
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
          'duration',        l.duration,
          'order_index',     l.order_index,
          'is_downloadable', l.is_downloadable,
          'is_protected',    l.is_protected,
          'can_access', CASE
            WHEN uid IS NULL                       THEN false
            WHEN NOT coalesce(v_is_active, false)  THEN false
            WHEN v_role = 'admin'                  THEN true
            WHEN NOT l.is_protected                THEN true
            WHEN v_has_sub                         THEN true
            ELSE false
          END,
          'lock_reason', CASE
            WHEN uid IS NULL                       THEN 'not_authenticated'
            WHEN NOT coalesce(v_is_active, false)  THEN 'inactive_account'
            WHEN NOT l.is_protected                THEN NULL
            WHEN v_has_sub                         THEN NULL
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
