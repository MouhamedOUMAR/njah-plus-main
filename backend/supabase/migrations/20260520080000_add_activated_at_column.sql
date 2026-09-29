-- ============================================================
-- 20260520080000_add_activated_at_column.sql
-- Add missing columns to student_subscriptions and update management function
-- ============================================================

-- 1. Alter table to ensure all columns exist
ALTER TABLE public.student_subscriptions
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS payment_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_verified_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'MRU',
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Drop existing admin_manage_subscription so we can recreate it with correct column inputs
DROP FUNCTION IF EXISTS public.admin_manage_subscription(uuid, text, text, numeric, text, text, text, text);

CREATE OR REPLACE FUNCTION public.admin_manage_subscription(
  p_student_id uuid,
  p_action text,            -- 'activate', 'renew', 'revoke', 'block'
  p_plan_type text DEFAULT NULL,    -- 'monthly', '3_months', 'yearly'
  p_amount_paid numeric DEFAULT 0,
  p_currency text DEFAULT 'MRU',
  p_payment_method text DEFAULT 'cash',
  p_payment_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean;
  v_current_expires_at timestamptz;
  v_new_starts_at timestamptz;
  v_new_expires_at timestamptz;
  v_interval interval;
  v_subscription_id uuid;
BEGIN
  -- Verify admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can manage subscriptions.';
  END IF;

  -- Validate student exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_student_id AND role = 'student') THEN
    RAISE EXCEPTION 'Student profile not found.';
  END IF;

  -- Determine duration from plan_type
  IF p_action IN ('activate', 'renew') THEN
    IF p_plan_type = 'monthly' THEN v_interval := interval '1 month';
    ELSIF p_plan_type = '3_months' THEN v_interval := interval '3 months';
    ELSIF p_plan_type = 'yearly' THEN v_interval := interval '1 year';
    ELSE RAISE EXCEPTION 'Invalid plan_type: %', p_plan_type;
    END IF;
  END IF;

  IF p_action = 'activate' THEN
    -- Activation logic: start from now
    v_new_starts_at := now();
    v_new_expires_at := v_new_starts_at + v_interval;
    
    -- Invalidate any currently active subscriptions for this user
    UPDATE public.student_subscriptions
    SET subscription_status = 'expired', updated_at = now()
    WHERE student_id = p_student_id AND subscription_status = 'active';

    INSERT INTO public.student_subscriptions (
      student_id, plan_type, payment_status, subscription_status, 
      activated_by, activated_at, payment_verified_by, payment_verified_at, 
      starts_at, expires_at, amount_paid, currency, payment_method, payment_reference, notes
    ) VALUES (
      p_student_id, p_plan_type, 'paid', 'active',
      auth.uid(), now(), auth.uid(), now(),
      v_new_starts_at, v_new_expires_at,
      p_amount_paid, p_currency, p_payment_method, p_payment_reference, p_notes
    ) RETURNING id INTO v_subscription_id;

    -- Update profiles
    UPDATE public.profiles
    SET subscription_status = 'active',
        subscription_expires_at = v_new_expires_at,
        subscription_plan = p_plan_type
    WHERE id = p_student_id;

    RETURN json_build_object('success', true, 'action', 'activate', 'subscription_id', v_subscription_id, 'expires_at', v_new_expires_at);

  ELSIF p_action = 'renew' THEN
    -- Renewal logic: extend from existing active expires_at if it exists and is in the future
    SELECT expires_at INTO v_current_expires_at
    FROM public.student_subscriptions
    WHERE student_id = p_student_id AND subscription_status = 'active'
    ORDER BY expires_at DESC LIMIT 1;

    IF v_current_expires_at IS NULL OR v_current_expires_at < now() THEN
      v_new_starts_at := now();
    ELSE
      v_new_starts_at := v_current_expires_at;
    END IF;

    v_new_expires_at := v_new_starts_at + v_interval;

    -- Invalidate previous active
    UPDATE public.student_subscriptions
    SET subscription_status = 'expired', updated_at = now()
    WHERE student_id = p_student_id AND subscription_status = 'active';

    INSERT INTO public.student_subscriptions (
      student_id, plan_type, payment_status, subscription_status, 
      activated_by, activated_at, payment_verified_by, payment_verified_at, 
      starts_at, expires_at, amount_paid, currency, payment_method, payment_reference, notes
    ) VALUES (
      p_student_id, p_plan_type, 'paid', 'active',
      auth.uid(), now(), auth.uid(), now(),
      v_new_starts_at, v_new_expires_at,
      p_amount_paid, p_currency, p_payment_method, p_payment_reference, p_notes
    ) RETURNING id INTO v_subscription_id;

    -- Update profiles
    UPDATE public.profiles
    SET subscription_status = 'active',
        subscription_expires_at = v_new_expires_at,
        subscription_plan = p_plan_type
    WHERE id = p_student_id;

    RETURN json_build_object('success', true, 'action', 'renew', 'subscription_id', v_subscription_id, 'expires_at', v_new_expires_at);

  ELSIF p_action IN ('revoke', 'block') THEN
    UPDATE public.student_subscriptions
    SET subscription_status = CASE WHEN p_action = 'revoke' THEN 'expired' ELSE 'blocked' END,
        updated_at = now()
    WHERE student_id = p_student_id AND subscription_status = 'active';

    UPDATE public.profiles
    SET subscription_status = CASE WHEN p_action = 'revoke' THEN 'none' ELSE 'paused' END,
        subscription_expires_at = NULL,
        subscription_plan = NULL
    WHERE id = p_student_id;

    RETURN json_build_object('success', true, 'action', p_action);

  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_manage_subscription(uuid, text, text, numeric, text, text, text, text) TO authenticated;

NOTIFY pgrst, 'reload schema';
