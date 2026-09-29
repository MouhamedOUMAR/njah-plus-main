BEGIN;

CREATE OR REPLACE FUNCTION public.check_lesson_access(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_lesson  RECORD;
  v_has_sub boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'can_access', false,
      'reason', 'not_authenticated',
      'is_protected', false,
      'subscription_status', null
    );
  END IF;

  SELECT id, is_active, role, subscription_status
  INTO v_profile
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object(
      'can_access', false,
      'reason', 'not_authenticated',
      'is_protected', false,
      'subscription_status', null
    );
  END IF;

  IF NOT v_profile.is_active THEN
    RETURN jsonb_build_object(
      'can_access', false,
      'reason', 'inactive_account',
      'is_protected', false,
      'subscription_status', v_profile.subscription_status
    );
  END IF;

  SELECT l.id, l.is_protected, c.is_published
  INTO v_lesson
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  WHERE l.id = p_lesson_id;

  IF v_lesson.id IS NULL OR (v_profile.role <> 'admin' AND NOT v_lesson.is_published) THEN
    RETURN jsonb_build_object(
      'can_access', false,
      'reason', 'lesson_not_found',
      'is_protected', false,
      'subscription_status', v_profile.subscription_status
    );
  END IF;

  IF v_profile.role = 'admin' OR NOT v_lesson.is_protected THEN
    RETURN jsonb_build_object(
      'can_access', true,
      'reason', 'allowed',
      'is_protected', v_lesson.is_protected,
      'subscription_status', v_profile.subscription_status
    );
  END IF;

  v_has_sub := public.has_active_subscription(auth.uid());

  RETURN jsonb_build_object(
    'can_access', v_has_sub,
    'reason', CASE WHEN v_has_sub THEN 'allowed' ELSE 'subscription_required' END,
    'is_protected', true,
    'subscription_status', v_profile.subscription_status
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_course_detail(p_course_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid                  uuid    := auth.uid();
  v_is_active          boolean := false;
  v_role               text    := null;
  v_sub_status         text    := 'none';
  v_has_sub            boolean := false;
  v_course_published   boolean;
  result               json;
BEGIN
  IF uid IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT is_active, role, subscription_status
  INTO v_is_active, v_role, v_sub_status
  FROM public.profiles
  WHERE id = uid;

  IF NOT coalesce(v_is_active, false) THEN
    RETURN NULL;
  END IF;

  SELECT is_published
  INTO v_course_published
  FROM public.courses
  WHERE id = p_course_id;

  IF NOT FOUND OR (v_role <> 'admin' AND NOT v_course_published) THEN
    RETURN NULL;
  END IF;

  v_has_sub := public.has_active_subscription(uid);

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
    'lessons', coalesce((
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
            WHEN v_role = 'admin'   THEN true
            WHEN NOT l.is_protected THEN true
            ELSE v_has_sub
          END,
          'lock_reason', CASE
            WHEN v_role = 'admin' OR NOT l.is_protected OR v_has_sub THEN NULL
            ELSE 'subscription_required'
          END
        )
        ORDER BY l.order_index
      )
      FROM public.lessons l
      WHERE l.course_id = p_course_id
    ), '[]'::json),
    'subscription_status', v_sub_status
  )
  INTO result
  FROM public.courses c
  WHERE c.id = p_course_id;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.check_lesson_access(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_student_course_detail(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_lesson_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_course_detail(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
