-- Restore password_hash column removed prematurely in 20260428.
-- auth_sessions is NOT restored — login now issues Supabase JWT tokens directly.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash TEXT;
