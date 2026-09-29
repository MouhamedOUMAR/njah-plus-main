-- ============================================================
-- 20260520070000_secure_get_all_students.sql
-- Add strict admin auth check to admin_get_all_students
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_get_all_students()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN 
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(s), '[]'::json)
    FROM (
      SELECT
        id, full_name, phone, created_at,
        is_active, subscription_status, subscription_expires_at, subscription_plan
      FROM public.profiles
      WHERE role = 'student'
      ORDER BY created_at DESC
    ) s
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_all_students() TO authenticated;

NOTIFY pgrst, 'reload schema';
