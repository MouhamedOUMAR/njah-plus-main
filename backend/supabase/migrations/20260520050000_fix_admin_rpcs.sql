-- ============================================================
-- 20260520050000_fix_admin_rpcs.sql
-- Fix search_path and empty table handling in admin RPCs
-- ============================================================

-- 1. Fix admin_get_dashboard_stats
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean;
  v_total_students int;
  v_active_subscriptions int;
  v_expired_subscriptions int;
  v_pending_payments int;
  v_estimated_revenue numeric;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN 
    -- Return empty stats instead of throwing an error to avoid frontend crashes
    RETURN json_build_object(
      'total_students', 0,
      'active_subscriptions', 0,
      'expired_subscriptions', 0,
      'pending_payments', 0,
      'estimated_revenue', 0
    );
  END IF;

  SELECT count(*) INTO v_total_students FROM public.profiles WHERE role = 'student';
  
  SELECT count(*) INTO v_active_subscriptions 
  FROM public.profiles 
  WHERE role = 'student' AND subscription_status = 'active' AND subscription_expires_at > now();

  SELECT count(*) INTO v_expired_subscriptions 
  FROM public.profiles 
  WHERE role = 'student' AND subscription_status IN ('expired', 'none') AND subscription_expires_at < now();

  SELECT count(*) INTO v_pending_payments
  FROM public.student_subscriptions
  WHERE payment_status = 'pending';

  SELECT COALESCE(sum(amount_paid), 0) INTO v_estimated_revenue
  FROM public.student_subscriptions
  WHERE payment_status = 'paid';

  RETURN json_build_object(
    'total_students', v_total_students,
    'active_subscriptions', v_active_subscriptions,
    'expired_subscriptions', v_expired_subscriptions,
    'pending_payments', v_pending_payments,
    'estimated_revenue', v_estimated_revenue
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_dashboard_stats() TO authenticated;


-- 2. Fix admin_get_subscriptions
CREATE OR REPLACE FUNCTION public.admin_get_subscriptions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN 
    -- Return empty array instead of throwing an error
    RETURN '[]'::json; 
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
    FROM (
      SELECT 
        sub.id,
        sub.student_id,
        p.full_name AS student_name,
        p.phone AS student_phone,
        sub.plan_type,
        sub.payment_status,
        sub.subscription_status,
        sub.amount_paid,
        sub.currency,
        sub.starts_at,
        sub.expires_at,
        sub.payment_method,
        sub.created_at
      FROM public.student_subscriptions sub
      JOIN public.profiles p ON p.id = sub.student_id
      ORDER BY sub.created_at DESC
    ) s
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_subscriptions() TO authenticated;


-- 3. Fix admin_manage_subscription search_path just in case
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
      activated_by, activated_at, starts_at, expires_at,
      amount_paid, currency, payment_method, payment_reference, notes
    ) VALUES (
      p_student_id, p_plan_type, 'paid', 'active',
      auth.uid(), now(), v_new_starts_at, v_new_expires_at,
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
    -- Renewal logic: extend from existing active expires_at if it exists
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
      activated_by, activated_at, starts_at, expires_at,
      amount_paid, currency, payment_method, payment_reference, notes
    ) VALUES (
      p_student_id, p_plan_type, 'paid', 'active',
      auth.uid(), now(), v_new_starts_at, v_new_expires_at,
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
