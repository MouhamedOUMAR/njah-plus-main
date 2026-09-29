-- ── Cleanup wrong auth users and partial records ──────────────────────────────
--
-- This script deletes users created with the technical email format
-- and ensures profiles/student_profiles are consistent.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Delete users from auth.users with the wrong email format
DELETE FROM auth.users
WHERE email LIKE 'phone_%@bacenglish.local'
   OR email LIKE 'phone_%@bac.local'
   OR email LIKE 'phone_%@ba.local';

-- 2. Cleanup profiles that might be linked to deleted auth users (if cascade didn't work)
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- 3. Cleanup student_profiles that might be linked to deleted profiles
DELETE FROM public.student_profiles
WHERE profile_id NOT IN (SELECT id FROM public.profiles);

-- 4. Specific cleanup for the reported test user if it still exists in any form
-- (Optional, above steps should cover it)
