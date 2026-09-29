import 'server-only'

import { createClient, createAuthedClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/get-session'


export async function getAdminOverview() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_overview')
  if (error) {
    console.error('[getAdminOverview] RPC Error:', error)
    return {
      totalStudents: 0,
      totalCourses: 0,
      totalLessons: 0,
      completedLessons: 0,
      totalNotifications: 0,
    }
  }
  return data as {
    totalStudents: number
    totalCourses: number
    totalLessons: number
    completedLessons: number
    totalNotifications: number
  }
}

export async function getMonitoringStats() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_monitoring_stats')
  if (error) {
    console.error('[getMonitoringStats] RPC Error:', error)
    return { recent_events: [], suspicious_activity: [] }
  }
  return data as { recent_events: any[]; suspicious_activity: any[] }
}

export async function getRecentStudents() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_recent_students')
  if (error) {
    console.error('[getRecentStudents] RPC Error:', error)
    return []
  }
  return data as any[]
}

export async function getTopCourses() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_top_courses')
  if (error) {
    console.error('[getTopCourses] RPC Error:', error)
    return []
  }
  return data as any[]
}

export async function getAnalytics() {
  await requireAdmin()
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_analytics')
  if (error) {
    console.error('[getAnalytics] RPC Error:', error)
    return { top_courses: [], active_students_count: 0 }
  }
  return data as { top_courses: any[]; active_students_count: number }
}

export async function getDashboardSubscriptionStats() {
  await requireAdmin()
  const supabase = await createAuthedClient()
  const { data, error } = await supabase.rpc('admin_get_dashboard_stats')
  if (error) {
    console.error('[getDashboardSubscriptionStats] RPC Error:', error)
    return {
      total_students: 0,
      active_subscriptions: 0,
      expired_subscriptions: 0,
      pending_payments: 0,
      estimated_revenue: 0,
      total_notes: 0,
    }
  }
  return data as {
    total_students: number
    active_subscriptions: number
    expired_subscriptions: number
    pending_payments: number
    estimated_revenue: number
    total_notes: number
  }
}
