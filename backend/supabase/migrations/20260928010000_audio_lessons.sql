BEGIN;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS video_bucket text,
  ADD COLUMN IF NOT EXISTS video_path text,
  ADD COLUMN IF NOT EXISTS video_type text;

ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_video_type_check;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_video_type_check
    CHECK (video_type IN ('storage', 'youtube', 'vimeo', 'direct', 'audio'));

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lesson-videos',
  'lesson-videos',
  false,
  524288000,
  ARRAY[
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'audio/mpeg',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
    'audio/wav',
    'audio/x-wav',
    'audio/flac',
    'audio/x-m4a'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'lesson-videos: allow signed URL reads'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "lesson-videos: allow signed URL reads"
      ON storage.objects FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'lesson-videos')
    $policy$;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_course_detail(p_course_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid           uuid        := auth.uid();
  v_is_active   boolean     := false;
  v_role        text        := null;
  v_sub_status  text        := 'none';
  v_sub_expires timestamptz := null;
  v_has_sub     boolean     := false;
  result        json;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM courses WHERE id = p_course_id) THEN
    RETURN NULL;
  END IF;

  IF uid IS NOT NULL THEN
    SELECT is_active, role, subscription_status, subscription_expires_at
    INTO v_is_active, v_role, v_sub_status, v_sub_expires
    FROM profiles
    WHERE id = uid;

    v_has_sub := public.has_active_subscription(uid);
  END IF;

  SELECT json_build_object(
    'course', json_build_object(
      'id',             c.id,
      'title',          c.title,
      'description',    c.description,
      'thumbnail_url',  c.thumbnail_url,
      'category',       c.category,
      'license_year',   c.license_year,
      'semester',       c.semester,
      'total_duration', c.total_duration,
      'is_published',   c.is_published
    ),
    'lessons', (
      SELECT json_agg(
        jsonb_build_object(
          'id',              l.id,
          'course_id',       l.course_id,
          'title',           l.title,
          'description',     l.description,
          'video_type',      l.video_type,
          'duration',        l.duration,
          'order_index',     l.order_index,
          'is_downloadable', l.is_downloadable,
          'is_protected',    l.is_protected,
          'can_access', CASE
            WHEN uid IS NULL                      THEN false
            WHEN NOT coalesce(v_is_active, false) THEN false
            WHEN v_role = 'admin'                 THEN true
            WHEN NOT l.is_protected               THEN true
            WHEN v_has_sub                        THEN true
            ELSE false
          END,
          'lock_reason', CASE
            WHEN uid IS NULL                      THEN 'not_authenticated'
            WHEN NOT coalesce(v_is_active, false) THEN 'inactive_account'
            WHEN NOT l.is_protected               THEN NULL
            WHEN v_has_sub                        THEN NULL
            ELSE 'subscription_required'
          END
        )
        ORDER BY l.order_index
      )
      FROM lessons l
      WHERE l.course_id = p_course_id
    )
  )
  INTO result
  FROM courses c
  WHERE c.id = p_course_id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_student_course_detail(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
