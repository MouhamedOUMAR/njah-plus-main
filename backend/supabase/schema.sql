-- ============================================================
-- BacEnglish – Full Schema + RLS
-- Run this in Supabase SQL Editor
-- ============================================================

-- PROFILES
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  phone       text unique,
  full_name   text,
  avatar_url  text,
  role        text not null default 'student' check (role in ('student','admin')),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, role)
  values (
    new.id,
    new.phone,
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- COURSES
create table if not exists public.courses (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  thumbnail_url   text,
  category        text,
  license_year    text not null default 'L1'
                    check (license_year in ('L1', 'L2', 'L3')),
  semester        text not null default 'S1'
                    check (semester in ('S1', 'S2', 'S3', 'S4', 'S5', 'S6')),
  total_duration  integer not null default 0,
  rating          numeric(3,1) not null default 0,
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  constraint courses_license_semester_match check (
    (license_year = 'L1' and semester in ('S1', 'S2')) or
    (license_year = 'L2' and semester in ('S3', 'S4')) or
    (license_year = 'L3' and semester in ('S5', 'S6'))
  )
);

create index if not exists courses_license_semester_idx
  on public.courses (license_year, semester);

-- LESSONS
create table if not exists public.lessons (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references public.courses(id) on delete cascade,
  title           text not null,
  description     text,
  video_url       text,
  video_bucket    text,
  video_path      text,
  video_type      text check (video_type in ('storage', 'youtube', 'vimeo', 'direct', 'audio')),
  attachment_bucket text,
  attachment_path text,
  attachment_type text check (attachment_type is null or attachment_type in ('image', 'pdf')),
  attachment_name text,
  duration        integer not null default 0,
  order_index     integer not null default 0,
  is_downloadable boolean not null default false,
  is_protected    boolean not null default true,
  created_at      timestamptz not null default now()
);

-- USER PROGRESS
create table if not exists public.user_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  completed       boolean not null default false,
  watched_seconds integer not null default 0,
  completed_at    timestamptz,
  unique(user_id, lesson_id)
);

-- NOTES
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  title       text,
  content     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- FAVORITES
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  lesson_id   uuid references public.lessons(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists favorites_user_id_idx on public.favorites(user_id);
create index if not exists favorites_course_id_idx on public.favorites(course_id);
create index if not exists favorites_lesson_id_idx on public.favorites(lesson_id);
create unique index if not exists favorites_user_course_idx
  on public.favorites(user_id, course_id)
  where lesson_id is null;
create unique index if not exists favorites_user_lesson_idx
  on public.favorites(user_id, lesson_id)
  where lesson_id is not null;

-- HISTORY
create table if not exists public.history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  viewed_at   timestamptz not null default now()
);

-- NOTIFICATIONS
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  message     text not null,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- DOWNLOADS
create table if not exists public.downloads (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  file_name     text,
  file_url      text,
  downloaded_at timestamptz not null default now(),
  status        text
);

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.courses       enable row level security;
alter table public.lessons       enable row level security;
alter table public.user_progress enable row level security;
alter table public.notes         enable row level security;
alter table public.favorites     enable row level security;
alter table public.history       enable row level security;
alter table public.notifications enable row level security;
alter table public.downloads     enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select exists(
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- PROFILES policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles for select using (public.is_admin());
create policy "Admins can update all profiles" on public.profiles for update using (public.is_admin());

-- COURSES policies
create policy "Anyone authenticated reads published courses" on public.courses
  for select using (auth.role() = 'authenticated' and (is_published = true or public.is_admin()));
create policy "Admins can insert courses" on public.courses for insert with check (public.is_admin());
create policy "Admins can update courses" on public.courses for update using (public.is_admin());
create policy "Admins can delete courses" on public.courses for delete using (public.is_admin());

-- LESSONS policies
create policy "Authenticated users read lessons of published courses" on public.lessons
  for select using (
    auth.role() = 'authenticated' and (
      public.is_admin() or
      exists(select 1 from public.courses c where c.id = course_id and c.is_published = true)
    )
  );
create policy "Admins can insert lessons" on public.lessons for insert with check (public.is_admin());
create policy "Admins can update lessons" on public.lessons for update using (public.is_admin());
create policy "Admins can delete lessons" on public.lessons for delete using (public.is_admin());

-- USER_PROGRESS policies
create policy "Users manage own progress" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view all progress" on public.user_progress for select using (public.is_admin());

-- NOTES policies
create policy "Users manage own notes" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- FAVORITES policies
create policy "Users manage own favorites" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- HISTORY policies
create policy "Users manage own history" on public.history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view all history" on public.history for select using (public.is_admin());

-- NOTIFICATIONS policies
create policy "Users read own notifications" on public.notifications
  for select using (auth.uid() = user_id);
create policy "Users update own notifications" on public.notifications
  for update using (auth.uid() = user_id);
create policy "Admins can select all notifications" on public.notifications
  for select using (public.is_admin());
create policy "Admins can insert notifications" on public.notifications
  for insert with check (public.is_admin());
create policy "Admins can delete notifications" on public.notifications
  for delete using (public.is_admin());

-- DOWNLOADS policies
create policy "Users manage own downloads" on public.downloads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins view all downloads" on public.downloads for select using (public.is_admin());

-- ============================================================
-- OTP AUTH (ChinguiSoft SMS — used by Edge Functions)
-- ============================================================

-- Tracks sent OTPs; service role only (Edge Functions bypass RLS via service key)
create table if not exists public.otp_requests (
  id          uuid        primary key default gen_random_uuid(),
  phone       text        not null,
  code_hash   text        not null,
  expires_at  timestamptz not null,
  attempts    integer     not null default 0,
  verified    boolean     not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_otp_requests_phone on public.otp_requests (phone, expires_at);

alter table public.otp_requests enable row level security;
-- No RLS policies — service role key bypasses RLS; no direct client access intended.

-- ============================================================
-- ADDITIONAL PATCHES (apply after initial schema)
-- ============================================================

-- Run this in Supabase SQL Editor to apply missing policy:
-- create policy "Admins can select all notifications" on public.notifications
--   for select using (public.is_admin());

-- Inactive students: is_active=false is enforced at the app layer (requireAuth checks it).
-- Optionally, you can also block their Supabase Auth login by disabling the user in the
-- Supabase Auth admin panel. The is_active flag blocks access at the middleware/layout level.

-- ============================================================
-- STORAGE BUCKETS
-- Run in Supabase SQL Editor (Storage schema must exist first)
-- ============================================================

-- 'thumbnails' bucket: publicly readable (course cover images)
insert into storage.buckets (id, name, public)
  values ('thumbnails', 'thumbnails', true)
  on conflict (id) do nothing;

-- 'course-thumbnails' bucket: public course thumbnail uploads
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'course-thumbnails',
    'course-thumbnails',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 'lesson-assets' bucket: private lesson images and PDF files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'lesson-assets',
    'lesson-assets',
    false,
    26214400,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  )
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 'lesson-videos' bucket: private lesson video and audio files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'lesson-videos',
    'lesson-videos',
    false,
    524288000,
    array[
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm',
      'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/x-m4a'
    ]
  )
  on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: thumbnails (public reads, admin uploads)
create policy "Public read thumbnails"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

create policy "Admins upload thumbnails"
  on storage.objects for insert
  with check (bucket_id = 'thumbnails' and public.is_admin());

create policy "Admins delete thumbnails"
  on storage.objects for delete
  using (bucket_id = 'thumbnails' and public.is_admin());

-- Storage RLS: course-thumbnails (public reads, admin writes)
create policy "course-thumbnails: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'course-thumbnails');

create policy "course-thumbnails: admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'course-thumbnails' and public.is_admin());

create policy "course-thumbnails: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'course-thumbnails' and public.is_admin())
  with check (bucket_id = 'course-thumbnails' and public.is_admin());

create policy "course-thumbnails: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'course-thumbnails' and public.is_admin());

-- Storage RLS: lesson-assets (private — signed URL delivery via /api/lesson-stream)
-- Files are served by /api/lesson-attachment only after checking lesson access.
create policy "Admins upload lesson assets"
  on storage.objects for insert
  with check (bucket_id = 'lesson-assets' and public.is_admin());

create policy "Admins delete lesson assets"
  on storage.objects for delete
  using (bucket_id = 'lesson-assets' and public.is_admin());
