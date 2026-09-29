CREATE OR REPLACE FUNCTION public.admin_toggle_student_active(
  p_student_id uuid,
  p_is_active  boolean
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE profiles SET is_active = p_is_active WHERE id = p_student_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_toggle_student_active(uuid, boolean) TO authenticated;
