'use server'

import { createAuthedClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/get-session'

export async function getAllSubscriptions() {
  await requireAdmin()
  const supabase = await createAuthedClient()
  const { data, error } = await supabase.rpc('admin_get_subscriptions')
  
  if (error) {
    console.error('[getAllSubscriptions] RPC Error:', error)
    return []
  }
  
  return data as Array<{
    id: string
    student_id: string
    student_name: string | null
    student_phone: string | null
    plan_type: string
    payment_status: string
    subscription_status: string
    amount_paid: number
    currency: string
    starts_at: string
    expires_at: string
    payment_method: string | null
    created_at: string
  }>
}
