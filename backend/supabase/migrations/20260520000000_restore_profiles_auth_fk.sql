-- ============================================================
-- 20260520000000_restore_profiles_auth_fk.sql
--
-- Restores referential integrity between public.profiles and auth.users.
-- 1. Deletes orphaned profiles (where the auth user no longer exists).
-- 2. Restores profiles_id_fkey referencing auth.users(id) with ON DELETE CASCADE.
-- 3. Updates student_lesson_access(granted_by) to ON DELETE SET NULL.
-- ============================================================

-- 1. Clean up orphaned profiles (profiles without a matching auth user in auth.users)
-- These were left behind due to the dropped constraint and are corrupted test entries.
DELETE FROM public.profiles
WHERE id NOT IN (SELECT id FROM auth.users);

-- 2. Restore the profiles_id_fkey constraint with CASCADE delete
-- Ensures when a user is deleted from auth.users, their profile is completely wiped.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Fix student_lesson_access granted_by constraint (if table exists)
-- Ensures that deleting administrator accounts is not blocked.
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'student_lesson_access') THEN
    ALTER TABLE public.student_lesson_access
      DROP CONSTRAINT IF EXISTS student_lesson_access_granted_by_fkey;

    ALTER TABLE public.student_lesson_access
      ADD CONSTRAINT student_lesson_access_granted_by_fkey
      FOREIGN KEY (granted_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
