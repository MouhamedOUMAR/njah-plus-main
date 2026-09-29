import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/get-session'
import { getCourses } from '@/actions/courses'
import { createAuthedClient } from '@/lib/supabase/server'
import DashboardView from '@/components/dashboard/DashboardView'
import type { DashboardStats } from '@/types'

export default async function DashboardPage() {
  // requireAuth validates session + active account; gives us the full profile
  const { profile } = await requireAuth()

  const supabase = await createAuthedClient()

  // Fetch dashboard stats and published courses in parallel.
  const [{ data: dashboard }, courses] = await Promise.all([
    supabase.rpc('get_student_dashboard'),
    getCourses(),
  ])

  // Redirect to login if the RPC explicitly says not_authenticated
  if ((dashboard as any)?.error === 'not_authenticated') {
    redirect('/login')
  }


  const stats: DashboardStats = {
    total_courses:   (dashboard as any)?.stats?.total_courses   ?? 0,
    total_lessons:   (dashboard as any)?.stats?.total_lessons   ?? 0,
    notes_count:     (dashboard as any)?.stats?.notes_count     ?? 0,
    history_count:   (dashboard as any)?.stats?.history_count   ?? 0,
  }

  const firstName = profile.full_name?.split(' ')[0] ?? null
  const hour      = new Date().getHours()

  return (
    <DashboardView
      profile={profile}
      courses={courses}
      firstName={firstName}
      hour={hour}
      stats={stats}
    />
  )
}
