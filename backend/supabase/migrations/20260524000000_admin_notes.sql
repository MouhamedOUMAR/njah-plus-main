-- ============================================================
-- 20260524000000_admin_notes.sql
-- Admin RPCs for student notes (Robust Joins)
-- ============================================================

-- 1. admin_get_all_notes
-- Returns all student notes with associated student, lesson, and course info.
-- Uses LEFT JOINs to ensure notes appear even if related data is missing.
CREATE OR REPLACE FUNCTION public.admin_get_all_notes()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Verify the calling user is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN 
    RETURN '[]'::json; 
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(n)), '[]'::json)
    FROM (
      SELECT 
        notes.id           AS note_id,
        notes.content,
        notes.created_at,
        notes.updated_at,
        notes.user_id      AS student_id,
        COALESCE(p.full_name, 'Étudiant inconnu') AS student_name,
        COALESCE(p.phone, '')                   AS student_phone,
        notes.lesson_id    AS lesson_id,
        COALESCE(l.title, 'Leçon supprimée')    AS lesson_title,
        l.course_id        AS course_id,
        COALESCE(c.title, 'Cours inconnu')      AS course_title
      FROM public.notes
      LEFT JOIN public.profiles p ON p.id = notes.user_id
      LEFT JOIN public.lessons l  ON l.id = notes.lesson_id
      LEFT JOIN public.courses c  ON c.id = l.course_id
      ORDER BY notes.created_at DESC
    ) n
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_all_notes() TO authenticated;

-- 2. admin_delete_note
-- Deletes a specific note. Only accessible by admins.
CREATE OR REPLACE FUNCTION public.admin_delete_note(p_note_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- Verify the calling user is an admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN 
    RAISE EXCEPTION 'Unauthorized: Admin privileges required.';
  END IF;

  DELETE FROM public.notes WHERE id = p_note_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_note(uuid) TO authenticated;

-- 3. Update admin_get_dashboard_stats to include total_notes
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean;
  v_total_students int;
  v_active_subscriptions int;
  v_expired_subscriptions int;
  v_pending_payments int;
  v_estimated_revenue numeric;
  v_total_notes int;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN 
    RETURN json_build_object(
      'total_students', 0,
      'active_subscriptions', 0,
      'expired_subscriptions', 0,
      'pending_payments', 0,
      'estimated_revenue', 0,
      'total_notes', 0
    );
  END IF;

  SELECT count(*) INTO v_total_students FROM public.profiles WHERE role = 'student';
  
  SELECT count(*) INTO v_active_subscriptions 
  FROM public.profiles 
  WHERE role = 'student' AND subscription_status = 'active' AND subscription_expires_at > now();

  SELECT count(*) INTO v_expired_subscriptions 
  FROM public.profiles 
  WHERE role = 'student' AND subscription_status IN ('expired', 'none') AND (subscription_expires_at IS NULL OR subscription_expires_at < now());

  SELECT count(*) INTO v_pending_payments
  FROM public.student_subscriptions
  WHERE payment_status = 'pending';

  SELECT COALESCE(sum(amount_paid), 0) INTO v_estimated_revenue
  FROM public.student_subscriptions
  WHERE payment_status = 'paid';

  SELECT count(*) INTO v_total_notes FROM public.notes;

  RETURN json_build_object(
    'total_students', v_total_students,
    'active_subscriptions', v_active_subscriptions,
    'expired_subscriptions', v_expired_subscriptions,
    'pending_payments', v_pending_payments,
    'estimated_revenue', v_estimated_revenue,
    'total_notes', v_total_notes
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats() TO authenticated;

NOTIFY pgrst, 'reload schema';
