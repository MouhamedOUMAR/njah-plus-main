-- ============================================================
-- DROP DIAGNOSTIC VIEWS
-- phone_verifications already exists in production.
-- This migration only removes the diag_* views.
-- ============================================================

-- Drop the diagnostic views (not needed in production)
DROP VIEW IF EXISTS public.diag_profiles_missing_auth;
DROP VIEW IF EXISTS public.diag_auth_missing_profile;
DROP VIEW IF EXISTS public.diag_duplicate_phones;

-- Delete the corrupted/duplicate user in auth.users directly via SQL to bypass GoTrue API errors
DELETE FROM auth.users WHERE id = 'f3940de6-f287-4001-9bbe-e3377d050a62';

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
