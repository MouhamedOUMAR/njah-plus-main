-- ============================================================
-- 20260520060000_restore_admin_unauthorized.sql
-- Restore strict Unauthorized exceptions in admin RPCs
-- ============================================================

-- 1. admin_get_dashboard_stats
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
    RAISE EXCEPTION 'Unauthorized';
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

-- 2. admin_get_subscriptions
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
    RAISE EXCEPTION 'Unauthorized';
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

NOTIFY pgrst, 'reload schema';
