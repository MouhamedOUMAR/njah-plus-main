-- ── Migrate auth users from fake-email to phone-based auth ───────────────────
--
-- This deletes all auth.users rows that were created with synthetic @bac.local
-- emails. The corresponding profiles rows are kept intact.
-- Users will re-register via the OTP flow (finalize-registration handles the
-- "profile exists, no auth user" case automatically — Case C).
--
-- Admin accounts: after deletion, the admin must be recreated via the admin API
-- or by inserting directly (see comment below).
--
-- Run this AFTER deploying the updated Edge Functions that use phone auth.
-- ─────────────────────────────────────────────────────────────────────────────

-- Delete all fake @bac.local email auth users
DELETE FROM auth.users
WHERE email LIKE '%@bac.local'
   OR email LIKE '%@ba.local';

-- Note: if you also have a user with @bac.local that is admin, you must
-- recreate their auth entry using the Supabase admin API or dashboard after
-- they re-register via the OTP flow. Their profile and role in public.profiles
-- are preserved.
