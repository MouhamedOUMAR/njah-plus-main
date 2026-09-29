-- Remove custom password hashing — Supabase Auth handles passwords natively.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;
