-- ============================================================
-- CLEANUP BAD CORRUPTED TEST USER FROM AUTH.USERS
-- ============================================================

DELETE FROM auth.users WHERE id = 'f3940de6-f287-4001-9bbe-e3377d050a62';
