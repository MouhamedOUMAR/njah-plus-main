-- Recreate admin analytics RPCs that are missing from production DB,
-- then grant execute to authenticated role.

CREATE OR REPLACE FUNCTION public.admin_get_overview()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN json_build_object(
    'totalStudents',      (SELECT count(*) FROM profiles WHERE role = 'student'),
    'totalCourses',       (SELECT count(*) FROM courses),
    'totalLessons',       (SELECT count(*) FROM lessons),
    'completedLessons',   0,
    'totalNotifications', (SELECT count(*) FROM notifications)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_recent_students()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (
    SELECT json_agg(s)
    FROM (
      SELECT id, full_name, phone, created_at, is_active,
             subscription_status, subscription_expires_at
      FROM profiles
      WHERE role = 'student'
      ORDER BY created_at DESC
      LIMIT 5
    ) s
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_top_courses()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN (
    SELECT json_agg(c)
    FROM (
      SELECT id, title, category,
             (SELECT count(*) FROM lessons l WHERE l.course_id = c2.id) AS lesson_count
      FROM courses c2
      WHERE is_published = true
      ORDER BY created_at DESC
      LIMIT 5
    ) c
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_analytics()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN json_build_object(
    'top_courses', (
      SELECT COALESCE(json_agg(c), '[]'::json)
      FROM (
        SELECT c.id, c.title,
               (SELECT count(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count
        FROM courses c
        WHERE c.is_published = true
        ORDER BY lesson_count DESC
        LIMIT 5
      ) c
    ),
    'active_students_count', (
      SELECT count(*) FROM profiles
      WHERE role = 'student' AND is_active = true
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_overview()        TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_recent_students() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_top_courses()     TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_get_analytics()       TO authenticated;
