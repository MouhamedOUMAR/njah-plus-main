export type Role = 'student' | 'admin'

export type SubscriptionStatus = 'none' | 'active' | 'expired' | 'paused'
export type LicenseYear = 'L1' | 'L2' | 'L3'
export type Semester = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6'

export interface Profile {
  id: string
  phone: string
  full_name: string | null
  avatar_url: string | null
  role: Role
  is_active: boolean
  subscription_status: SubscriptionStatus
  subscription_expires_at: string | null
  subscription_plan?: string | null
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  category: string | null
  license_year: LicenseYear
  semester: Semester
  total_duration: number
  rating: number
  is_published: boolean
  created_at: string
  lessons?: Lesson[]
  _count?: { lessons: number }
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description: string | null
  video_url: string | null
  video_bucket: string | null
  video_path:   string | null
  video_type:   'storage' | 'youtube' | 'vimeo' | 'direct' | 'audio' | null
  attachment_bucket: string | null
  attachment_path: string | null
  attachment_type: 'image' | 'pdf' | null
  attachment_name: string | null
  duration: number
  order_index: number
  is_downloadable: boolean
  is_protected: boolean
  created_at: string
  course?: Pick<Course, 'id' | 'title'>
  // Populated by get_student_course_detail RPC
  can_access?: boolean
  lock_reason?: 'inactive_account' | 'subscription_required' | null
}

export type DownloadableLesson = Pick<
  Lesson,
  'id' | 'title' | 'duration' | 'created_at' | 'video_type'
> & {
  course?: { id: string; title: string; is_published: boolean } | null
}

export interface LessonAccessResult {
  can_access: boolean
  reason: 'allowed' | 'not_authenticated' | 'inactive_account' | 'subscription_required' | 'lesson_not_found'
  is_protected: boolean
  subscription_status: SubscriptionStatus | null
}

export interface Note {
  id: string
  user_id: string
  lesson_id: string
  content: string
  created_at: string
  updated_at: string
}

export interface AdminNote {
  note_id: string
  content: string
  created_at: string
  updated_at: string
  student_id: string
  student_name: string
  student_phone: string
  lesson_id: string
  lesson_title: string
  course_id: string
  course_title: string
}

export interface HistoryEntry {
  id: string
  user_id: string
  lesson_id: string
  viewed_at: string
  lesson?: Lesson & { course?: Pick<Course, 'id' | 'title' | 'thumbnail_url'> }
}

export interface DashboardStats {
  total_courses: number
  total_lessons: number
  notes_count: number
  history_count: number
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}
