-- ============================================================
-- 20260428000000_subscription_access.sql
-- Final clean auth/profile + subscription-aware access model
-- ============================================================

-- ── 1. Remove legacy custom-auth column ─────────────────────
ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_hash;

-- ── 2. Add subscription fields ──────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'expired', 'paused')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ── 3. Drop legacy auth_sessions table and RPCs ─────────────
DROP TABLE IF EXISTS public.auth_sessions CASCADE;

DROP FUNCTION IF EXISTS public.auth_validate_session(text);
DROP FUNCTION IF EXISTS public.auth_invalidate_session(text);
DROP FUNCTION IF EXISTS public.auth_create_session(uuid, text);

-- ── 4. get_my_auth_status — include subscription fields ──────
CREATE OR REPLACE FUNCTION public.get_my_auth_status()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN (
    SELECT json_build_object(
      'id',                      id,
      'phone',                   phone,
      'full_name',               full_name,
      'avatar_url',              avatar_url,
      'role',                    role,
      'is_active',               is_active,
      'subscription_status',     subscription_status,
      'subscription_expires_at', subscription_expires_at,
      'created_at',              created_at
    )
    FROM profiles
    WHERE id = auth.uid()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_auth_status() TO authenticated;

-- ── 5. check_lesson_access(p_lesson_id) — uses auth.uid() ────
-- Drops both old signatures before recreating.
DROP FUNCTION IF EXISTS public.check_lesson_access(uuid, uuid);
DROP FUNCTION IF EXISTS public.check_lesson_access(uuid);

CREATE OR REPLACE FUNCTION public.check_lesson_access(p_lesson_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_lesson  RECORD;
BEGIN
  -- 1. Must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object(
      'can_access',           false,
      'reason',               'not_authenticated',
      'is_protected',         false,
      'subscription_status',  null
    );
  END IF;

  -- 2. Load profile
  SELECT id, is_active, role, subscription_status, subscription_expires_at
  INTO v_profile
  FROM profiles
  WHERE id = auth.uid();

  IF v_profile.id IS NULL THEN
    RETURN jsonb_build_object(
      'can_access',           false,
      'reason',               'not_authenticated',
      'is_protected',         false,
      'subscription_status',  null
    );
  END IF;

  -- 3. Account must be active
  IF NOT v_profile.is_active THEN
    RETURN jsonb_build_object(
      'can_access',           false,
      'reason',               'inactive_account',
      'is_protected',         false,
      'subscription_status',  v_profile.subscription_status
    );
  END IF;

  -- 4. Load lesson
  SELECT id, is_protected
  INTO v_lesson
  FROM lessons
  WHERE id = p_lesson_id;

  IF v_lesson.id IS NULL THEN
    RETURN jsonb_build_object(
      'can_access',           false,
      'reason',               'lesson_not_found',
      'is_protected',         false,
      'subscription_status',  v_profile.subscription_status
    );
  END IF;

  -- 5. Admins always have access
  IF v_profile.role = 'admin' THEN
    RETURN jsonb_build_object(
      'can_access',           true,
      'reason',               'allowed',
      'is_protected',         v_lesson.is_protected,
      'subscription_status',  v_profile.subscription_status
    );
  END IF;

  -- 6. Unprotected lesson → all active students can access
  IF NOT v_lesson.is_protected THEN
    RETURN jsonb_build_object(
      'can_access',           true,
      'reason',               'allowed',
      'is_protected',         false,
      'subscription_status',  v_profile.subscription_status
    );
  END IF;

  -- 7. Protected lesson → active subscription required
  IF v_profile.subscription_status = 'active'
     AND (v_profile.subscription_expires_at IS NULL
          OR v_profile.subscription_expires_at > now())
  THEN
    RETURN jsonb_build_object(
      'can_access',           true,
      'reason',               'allowed',
      'is_protected',         true,
      'subscription_status',  v_profile.subscription_status
    );
  END IF;

  RETURN jsonb_build_object(
    'can_access',           false,
    'reason',               'subscription_required',
    'is_protected',         true,
    'subscription_status',  v_profile.subscription_status
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_lesson_access(uuid) TO authenticated;

-- ── 6. get_student_course_detail — subscription-aware lessons ─
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
  SELECT id INTO v_course_id FROM courses WHERE id::text = p_slug;
  IF v_course_id IS NULL THEN RETURN NULL; END IF;

  -- Load user access state
  SELECT is_active, role, subscription_status, subscription_expires_at
  INTO v_is_active, v_role, v_sub_status, v_sub_expires
  FROM profiles
  WHERE id = p_user_id;

  v_has_sub := (v_sub_status = 'active')
    AND (v_sub_expires IS NULL OR v_sub_expires > now());

  RETURN (
    SELECT json_build_object(
      'course',  (SELECT to_jsonb(c) FROM courses c WHERE c.id = v_course_id),
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
              WHEN v_has_sub                         THEN true
              ELSE false
            END,
            'lock_reason', CASE
              WHEN NOT coalesce(v_is_active, false) THEN 'inactive_account'
              WHEN NOT l.is_protected               THEN NULL
              WHEN v_has_sub                         THEN NULL
              ELSE 'subscription_required'
            END
          )
          ORDER BY l.order_index
        )
        FROM lessons l
        WHERE l.course_id = v_course_id
      )
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_course_detail(uuid, text) TO authenticated;

-- ── 7. admin_get_all_students — include subscription info ─────
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
        is_active, subscription_status, subscription_expires_at
      FROM profiles
      WHERE role = 'student'
      ORDER BY created_at DESC
    ) s
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_all_students() TO authenticated;

-- ── 8. admin_set_subscription — new RPC ──────────────────────
DROP FUNCTION IF EXISTS public.admin_set_subscription(uuid, text, timestamptz);

CREATE OR REPLACE FUNCTION public.admin_set_subscription(
  p_student_id uuid,
  p_status     text,
  p_expires_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_status NOT IN ('none', 'active', 'expired', 'paused') THEN
    RAISE EXCEPTION 'invalid subscription_status value: %', p_status;
  END IF;

  UPDATE profiles
  SET subscription_status     = p_status,
      subscription_expires_at = p_expires_at
  WHERE id = p_student_id
    AND role = 'student';
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_subscription(uuid, text, timestamptz) TO authenticated;

-- ── 9. Ensure student_profiles extension columns exist ────────
-- Guard against partial migration history on older deployments.
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS level  text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS school text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS class  text;
ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS bio    text;

-- ── 10. Optional read-only views (app logic uses base tables) ─
CREATE OR REPLACE VIEW public.student_accounts_view AS
SELECT
  p.id,
  p.phone,
  p.full_name,
  p.avatar_url,
  p.is_active,
  p.subscription_status,
  p.subscription_expires_at,
  p.created_at,
  sp.level,
  sp.school,
  sp.class,
  sp.bio
FROM public.profiles p
LEFT JOIN public.student_profiles sp ON sp.profile_id = p.id
WHERE p.role = 'student';

ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE public.admin_profiles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;

CREATE OR REPLACE VIEW public.admin_accounts_view AS
SELECT
  p.id,
  p.phone,
  p.full_name,
  p.avatar_url,
  p.is_active,
  p.created_at,
  ap.title,
  ap.permissions
FROM public.profiles p
LEFT JOIN public.admin_profiles ap ON ap.profile_id = p.id
WHERE p.role = 'admin';

NOTIFY pgrst, 'reload schema';
