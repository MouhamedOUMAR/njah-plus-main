-- ============================================================
-- 20260520020000_global_subscriptions.sql
-- Implement global subscriptions replacing per-course payments
-- ============================================================

-- 1. Create student_subscriptions table
CREATE TABLE public.student_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('monthly', '3_months', 'yearly')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'refunded')),
  subscription_status text NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'expired', 'blocked')),
  
  amount_paid numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'MRU',
  
  activated_by uuid REFERENCES public.profiles(id),
  payment_verified_at timestamptz,
  payment_verified_by uuid REFERENCES public.profiles(id),
  
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  
  payment_method text,
  payment_reference text,
  notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Set up RLS
ALTER TABLE public.student_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on student_subscriptions" 
  ON public.student_subscriptions 
  FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Students can read their own subscriptions"
  ON public.student_subscriptions
  FOR SELECT
  USING (student_id = auth.uid());

-- Add subscription_plan to profiles for caching
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan text;

-- 2. has_active_subscription function
CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_active boolean;
BEGIN
  IF p_user_id IS NULL THEN RETURN false; END IF;
  
  -- Admins always have access
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RETURN true;
  END IF;

  -- Security check: non-admin can only check their own user_id
  IF p_user_id <> auth.uid() THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.student_subscriptions
    WHERE student_id = p_user_id
      AND payment_status = 'paid'
      AND subscription_status = 'active'
      AND expires_at > now()
  ) INTO v_has_active;

  RETURN v_has_active;
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated;

-- 3. Update check_lesson_access to use has_active_subscription
CREATE OR REPLACE FUNCTION public.check_lesson_access(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_lesson  RECORD;
  v_has_sub boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('can_access', false, 'reason', 'not_authenticated', 'is_protected', false, 'subscription_status', null);
  END IF;

  SELECT id, is_active, role, subscription_status
  INTO v_profile
  FROM public.profiles WHERE id = auth.uid();

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object('can_access', false, 'reason', 'not_authenticated', 'is_protected', false, 'subscription_status', null);
  END IF;

  IF NOT v_profile.is_active THEN
    RETURN jsonb_build_object('can_access', false, 'reason', 'inactive_account', 'is_protected', false, 'subscription_status', v_profile.subscription_status);
  END IF;

  SELECT id, is_protected INTO v_lesson FROM public.lessons WHERE id = p_lesson_id;

  IF v_lesson.id IS NULL THEN
    RETURN jsonb_build_object('can_access', false, 'reason', 'lesson_not_found', 'is_protected', false, 'subscription_status', v_profile.subscription_status);
  END IF;

  IF v_profile.role = 'admin' THEN
    RETURN jsonb_build_object('can_access', true, 'reason', 'allowed', 'is_protected', v_lesson.is_protected, 'subscription_status', v_profile.subscription_status);
  END IF;

  IF NOT v_lesson.is_protected THEN
    RETURN jsonb_build_object('can_access', true, 'reason', 'allowed', 'is_protected', false, 'subscription_status', v_profile.subscription_status);
  END IF;

  v_has_sub := public.has_active_subscription(auth.uid());

  IF v_has_sub THEN
    RETURN jsonb_build_object('can_access', true, 'reason', 'allowed', 'is_protected', true, 'subscription_status', v_profile.subscription_status);
  END IF;

  RETURN jsonb_build_object('can_access', false, 'reason', 'subscription_required', 'is_protected', true, 'subscription_status', v_profile.subscription_status);
END;
$$;

-- 4. Update get_student_course_detail to use has_active_subscription
CREATE OR REPLACE FUNCTION public.get_student_course_detail(p_user_id uuid, p_slug text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id   uuid;
  v_is_active   boolean;
  v_role        text;
  v_sub_status  text;
  v_sub_expires timestamptz;
  v_has_sub     boolean;
BEGIN
  SELECT id INTO v_course_id FROM public.courses WHERE id::text = p_slug;
  IF v_course_id IS NULL THEN RETURN NULL; END IF;

  SELECT is_active, role, subscription_status, subscription_expires_at
  INTO v_is_active, v_role, v_sub_status, v_sub_expires
  FROM public.profiles
  WHERE id = p_user_id;

  v_has_sub := public.has_active_subscription(p_user_id);

  RETURN (
    SELECT json_build_object(
      'course',  (SELECT to_jsonb(c) FROM public.courses c WHERE c.id = v_course_id),
      'lessons', (
        SELECT json_agg(
          jsonb_build_object(
            'id',              l.id,
            'title',           l.title,
            'description',     l.description,
            'duration',        l.duration,
            'order_index',     l.order_index,
            'is_protected',    l.is_protected,
            'is_downloadable', l.is_downloadable,
            'course_id',       l.course_id,
            'can_access', CASE
              WHEN NOT coalesce(v_is_active, false) THEN false
              WHEN v_role = 'admin'                 THEN true
              WHEN NOT l.is_protected               THEN true
              WHEN v_has_sub                        THEN true
              ELSE false
            END,
            'lock_reason', CASE
              WHEN NOT coalesce(v_is_active, false) THEN 'inactive_account'
              WHEN NOT l.is_protected               THEN NULL
              WHEN v_has_sub                        THEN NULL
              ELSE 'subscription_required'
            END
          )
          ORDER BY l.order_index
        )
        FROM public.lessons l
        WHERE l.course_id = v_course_id
      )
    )
  );
END;
$$;

-- 5. RPC: admin_manage_subscription
CREATE OR REPLACE FUNCTION public.admin_manage_subscription(
  p_student_id uuid,
  p_action text, -- 'activate', 'renew', 'revoke', 'block'
  p_plan_type text DEFAULT NULL,
  p_amount_paid numeric DEFAULT 0,
  p_currency text DEFAULT 'MRU',
  p_payment_method text DEFAULT NULL,
  p_payment_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_is_admin boolean;
  v_starts_at timestamptz;
  v_expires_at timestamptz;
  v_current_expires_at timestamptz;
  v_interval interval;
  v_new_sub_id uuid;
BEGIN
  -- Verify admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_admin_id AND role = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can manage subscriptions.';
  END IF;

  IF p_action IN ('activate', 'renew') THEN
    IF p_plan_type IS NULL THEN
      RAISE EXCEPTION 'plan_type is required for activation/renewal';
    END IF;

    -- Determine interval
    IF p_plan_type = 'monthly' THEN v_interval := interval '1 month';
    ELSIF p_plan_type = '3_months' THEN v_interval := interval '3 months';
    ELSIF p_plan_type = 'yearly' THEN v_interval := interval '1 year';
    ELSE RAISE EXCEPTION 'Invalid plan_type: %', p_plan_type;
    END IF;

    -- Get current expiration if any active sub exists
    SELECT expires_at INTO v_current_expires_at
    FROM public.student_subscriptions
    WHERE student_id = p_student_id AND subscription_status = 'active'
    ORDER BY expires_at DESC LIMIT 1;

    -- Renewal logic: extend from current expiry if active, else start now
    IF p_action = 'renew' AND v_current_expires_at IS NOT NULL AND v_current_expires_at > now() THEN
      v_starts_at := v_current_expires_at;
    ELSE
      v_starts_at := now();
      -- Mark previous active subs as expired/inactive if we are re-activating from scratch
      UPDATE public.student_subscriptions
      SET subscription_status = 'expired', updated_at = now()
      WHERE student_id = p_student_id AND subscription_status = 'active';
    END IF;

    v_expires_at := v_starts_at + v_interval;

    -- Insert new subscription
    INSERT INTO public.student_subscriptions (
      student_id, plan_type, payment_status, subscription_status,
      amount_paid, currency, activated_by, payment_verified_at, payment_verified_by,
      starts_at, expires_at, payment_method, payment_reference, notes
    ) VALUES (
      p_student_id, p_plan_type, 'paid', 'active',
      p_amount_paid, p_currency, v_admin_id, now(), v_admin_id,
      v_starts_at, v_expires_at, p_payment_method, p_payment_reference, p_notes
    ) RETURNING id INTO v_new_sub_id;

    -- Update profile cache
    UPDATE public.profiles
    SET subscription_status = 'active',
        subscription_expires_at = v_expires_at,
        subscription_plan = p_plan_type
    WHERE id = p_student_id;

    RETURN jsonb_build_object('success', true, 'action', p_action, 'subscription_id', v_new_sub_id, 'expires_at', v_expires_at);

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

    RETURN jsonb_build_object('success', true, 'action', p_action);

  ELSE
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_manage_subscription(uuid, text, text, numeric, text, text, text, text) TO authenticated;

-- 6. RPC: admin_get_dashboard_stats
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

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

-- 7. RPC: admin_get_subscriptions
CREATE OR REPLACE FUNCTION public.admin_get_subscriptions()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  RETURN (
    SELECT json_agg(row_to_json(s))
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

-- 8. Update admin_get_all_students to include subscription_plan
CREATE OR REPLACE FUNCTION public.admin_get_all_students()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT json_agg(s)
    FROM (
      SELECT
        id, full_name, phone, created_at,
        is_active, subscription_status, subscription_expires_at, subscription_plan
      FROM public.profiles
      WHERE role = 'student'
      ORDER BY created_at DESC
    ) s
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.admin_get_all_students() TO authenticated;
NOTIFY pgrst, 'reload schema';
