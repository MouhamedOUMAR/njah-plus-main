-- ── Security cleanup ──────────────────────────────────────────────────────────

-- 1. Restrict diagnostic views to service_role only (not readable by anon/authenticated)
REVOKE ALL ON public.diag_profiles_missing_auth FROM anon, authenticated;
GRANT  SELECT ON public.diag_profiles_missing_auth TO service_role;

REVOKE ALL ON public.diag_auth_missing_profile FROM anon, authenticated;
GRANT  SELECT ON public.diag_auth_missing_profile TO service_role;

REVOKE ALL ON public.diag_duplicate_phones FROM anon, authenticated;
GRANT  SELECT ON public.diag_duplicate_phones TO service_role;

-- 2. Revoke anon execute on admin RPCs (authenticated-only, internal role check inside)
REVOKE EXECUTE ON FUNCTION public.admin_reset_student_password(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_toggle_student_active(uuid, boolean) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_all_students() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_subscription(uuid, text, timestamptz) FROM anon;

-- 3. Fix handle_updated_at trigger function search_path (security advisor)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
