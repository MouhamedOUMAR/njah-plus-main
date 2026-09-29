-- ============================================================
-- get_my_auth_status — returns the calling user's profile
-- Called from: middleware, login page, register page
-- Uses auth.uid() from the JWT — no service-role key needed
-- ============================================================

create or replace function public.get_my_auth_status()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return null;
  end if;

  return (
    select json_build_object(
      'id',         id,
      'phone',      phone,
      'full_name',  full_name,
      'avatar_url', avatar_url,
      'role',       role,
      'is_active',  is_active,
      'created_at', created_at
    )
    from profiles
    where id = auth.uid()
  );
end;
$$;

grant execute on function public.get_my_auth_status() to authenticated;

-- ============================================================
-- Ensure repair_profile_sync is up-to-date (idempotent re-apply)
-- In case migration 20260426030000 was not applied yet.
-- ============================================================

drop function if exists public.repair_profile_sync(uuid, text, text);

create or replace function public.repair_profile_sync(
  p_auth_user_id uuid,
  p_phone        text,
  p_full_name    text default 'Étudiant'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_profile record;
  v_legacy_profile   record;
begin
  -- 1. Profile already exists with correct auth ID → nothing to do
  select id, role, is_active
  into v_existing_profile
  from public.profiles
  where id = p_auth_user_id;

  if v_existing_profile.id is not null then
    if v_existing_profile.role = 'student' then
      insert into public.student_profiles (profile_id)
      values (p_auth_user_id)
      on conflict (profile_id) do nothing;
    end if;

    return jsonb_build_object(
      'success',    true,
      'repaired',   false,
      'reason',     'already_synced',
      'profile_id', p_auth_user_id,
      'role',       v_existing_profile.role,
      'is_active',  v_existing_profile.is_active
    );
  end if;

  -- 2. Legacy profile with same phone but different ID → migrate
  select id, full_name, role, is_active, avatar_url
  into v_legacy_profile
  from public.profiles
  where phone = p_phone
  limit 1;

  if v_legacy_profile.id is not null then
    -- 2a. Create new profile row (temporary phone to avoid UNIQUE clash)
    insert into public.profiles (id, phone, full_name, role, is_active, avatar_url)
    values (
      p_auth_user_id,
      'MIGRATING_' || p_auth_user_id::text,
      coalesce(v_legacy_profile.full_name, p_full_name),
      coalesce(v_legacy_profile.role, 'student'),
      coalesce(v_legacy_profile.is_active, true),
      v_legacy_profile.avatar_url
    );

    -- 2b. Move notifications
    update public.notifications
    set user_id = p_auth_user_id
    where user_id = v_legacy_profile.id;

    -- 2c. Move student_profiles
    insert into public.student_profiles (profile_id, level, school, class, bio)
    select p_auth_user_id, level, school, class, bio
    from public.student_profiles
    where profile_id = v_legacy_profile.id
    on conflict (profile_id) do update set
      level  = coalesce(excluded.level,  student_profiles.level),
      school = coalesce(excluded.school, student_profiles.school),
      class  = coalesce(excluded.class,  student_profiles.class),
      bio    = coalesce(excluded.bio,    student_profiles.bio);
    delete from public.student_profiles where profile_id = v_legacy_profile.id;

    -- 2d. Move admin_profiles
    insert into public.admin_profiles (profile_id, title, permissions)
    select p_auth_user_id, title, permissions
    from public.admin_profiles
    where profile_id = v_legacy_profile.id
    on conflict (profile_id) do update set
      title       = coalesce(excluded.title,       admin_profiles.title),
      permissions = coalesce(excluded.permissions, admin_profiles.permissions);
    delete from public.admin_profiles where profile_id = v_legacy_profile.id;

    -- 2e. Delete old profile (all FKs now point to new ID)
    delete from public.profiles where id = v_legacy_profile.id;

    -- 2f. Set real phone on new profile
    update public.profiles
    set phone = p_phone
    where id = p_auth_user_id;

    -- Ensure student_profiles exists for new ID
    insert into public.student_profiles (profile_id)
    values (p_auth_user_id)
    on conflict (profile_id) do nothing;

    return jsonb_build_object(
      'success',        true,
      'repaired',       true,
      'reason',         'legacy_migrated',
      'old_profile_id', v_legacy_profile.id,
      'profile_id',     p_auth_user_id,
      'role',           coalesce(v_legacy_profile.role, 'student'),
      'is_active',      coalesce(v_legacy_profile.is_active, true)
    );
  end if;

  -- 3. No existing profile → create fresh
  insert into public.profiles (id, phone, full_name, role, is_active)
  values (p_auth_user_id, p_phone, p_full_name, 'student', true);

  insert into public.student_profiles (profile_id)
  values (p_auth_user_id)
  on conflict (profile_id) do nothing;

  return jsonb_build_object(
    'success',    true,
    'repaired',   true,
    'reason',     'fresh_profile_created',
    'profile_id', p_auth_user_id,
    'role',       'student',
    'is_active',  true
  );
end;
$$;

grant execute on function public.repair_profile_sync(uuid, text, text) to service_role;

notify pgrst, 'reload schema';
