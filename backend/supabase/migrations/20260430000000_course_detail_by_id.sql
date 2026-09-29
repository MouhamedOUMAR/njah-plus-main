-- ============================================================
-- 20260430000000_course_detail_by_id.sql
-- Replace get_student_course_detail(p_user_id, p_slug) with
-- get_student_course_detail(p_user_id, p_course_id) so the
-- frontend can navigate by course.id (slug may be NULL).
-- ============================================================

DROP FUNCTION IF EXISTS public.get_student_course_detail(uuid, text);

CREATE OR REPLACE FUNCTION public.get_student_course_detail(
  p_user_id   uuid,
  p_course_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_active   boolean;
  v_role        text;
  v_sub_status  text;
  v_sub_expires timestamptz;
  v_has_sub     boolean;
BEGIN
  -- Confirm the course exists
  IF NOT EXISTS (SELECT 1 FROM courses WHERE id = p_course_id) THEN
    RETURN NULL;
  END IF;

  -- Load user access state
  SELECT is_active, role, subscription_status, subscription_expires_at
  INTO v_is_active, v_role, v_sub_status, v_sub_expires
  FROM profiles
  WHERE id = p_user_id;

  v_has_sub := (v_sub_status = 'active')
    AND (v_sub_expires IS NULL OR v_sub_expires > now());

  RETURN (
    SELECT json_build_object(
      'course',  (SELECT to_jsonb(c) FROM courses c WHERE c.id = p_course_id),
      'lessons', (
        SELECT json_agg(
          jsonb_build_object(
            'id',              l.id,
            'title',           l.title,
            'description',     l.description,
            'duration',        l.duration,
            'order_index',     l.order_index,
            'is_protected',    l.is_protected,
            'is_downloadable', l.is_downloadable,
            'course_id',       l.course_id,
            'can_access', CASE
              WHEN NOT coalesce(v_is_active, false) THEN false
              WHEN v_role = 'admin'                 THEN true
              WHEN NOT l.is_protected               THEN true
              WHEN v_has_sub                        THEN true
              ELSE false
            END,
            'lock_reason', CASE
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
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_course_detail(uuid, uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
