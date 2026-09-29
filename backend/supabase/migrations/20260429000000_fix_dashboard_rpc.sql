-- ============================================================
-- 20260429000000_fix_dashboard_rpc.sql
-- Replace get_student_dashboard with a minimal, auth.uid()-based
-- version that matches the current schema (no deleted tables).
-- ============================================================

-- Drop old signature that took p_user_id (service-role pattern)
DROP FUNCTION IF EXISTS public.get_student_dashboard(uuid);
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
      'total_courses', (SELECT COUNT(*) FROM public.courses),
      'total_lessons', (SELECT COUNT(*) FROM public.lessons)
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
