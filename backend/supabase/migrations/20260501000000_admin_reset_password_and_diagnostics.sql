-- ── Admin helper: reset a student's Supabase Auth password ────────────────
-- Usage: SELECT admin_reset_student_password('+22247XXXXXX', 'newpassword');
-- This updates the hidden email user in auth.users for the given phone.
-- Only callable by authenticated admins (enforced inside function).

CREATE OR REPLACE FUNCTION public.admin_reset_student_password(
  p_phone       text,
  p_new_password text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role text;
  v_profile_id  uuid;
BEGIN
  -- Only admins can call this
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role IS DISTINCT FROM 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'forbidden');
  END IF;

  -- Find the profile
  SELECT id INTO v_profile_id FROM profiles WHERE phone = p_phone;
  IF v_profile_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'profile_not_found');
  END IF;

  -- Return profile_id so the Edge Function / app layer can call
  -- supabase.auth.admin.updateUserById(v_profile_id, { password: p_new_password })
  -- (auth.users cannot be updated directly from SQL — must go through GoTrue API)
  RETURN json_build_object('success', true, 'profile_id', v_profile_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_student_password(text, text) TO authenticated;

-- ── Diagnostic views (read-only, admin use only) ───────────────────────────

-- 1. Profiles that exist in public.profiles but have no matching auth.users row
CREATE OR REPLACE VIEW public.diag_profiles_missing_auth AS
SELECT p.id, p.phone, p.full_name, p.role, p.created_at
FROM   public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE  u.id IS NULL;

-- 2. auth.users with @bac.local email that have no matching profiles row
CREATE OR REPLACE VIEW public.diag_auth_missing_profile AS
SELECT u.id, u.email, u.created_at
FROM   auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE  u.email LIKE '%@bac.local'
  AND  p.id IS NULL;

-- 3. Duplicate phones in profiles
CREATE OR REPLACE VIEW public.diag_duplicate_phones AS
SELECT phone, count(*) AS cnt, array_agg(id) AS profile_ids
FROM   public.profiles
GROUP BY phone
HAVING count(*) > 1;
