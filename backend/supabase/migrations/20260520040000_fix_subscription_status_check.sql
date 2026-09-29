-- ============================================================
-- 20260520040000_fix_subscription_status_check.sql
-- Expand profiles.subscription_status check constraint to allow global subscription states.
-- ============================================================

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_subscription_status_check 
  CHECK (subscription_status IN ('none', 'active', 'inactive', 'expired', 'paused', 'blocked'));

-- Update any existing rows if needed (though none should exist yet that violate it since it was blocking)
