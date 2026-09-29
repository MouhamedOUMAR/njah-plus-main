'use server'
import { createClient, createAuthedClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth/get-session'

export async function getAllStudents() {
  await requireAdmin()
  const supabase = await createAuthedClient()
  const { data, error } = await supabase.rpc('admin_get_all_students')
  if (error) {
    console.error('[getAllStudents] RPC Error:', error)
    return []
  }
  return data as any[]
}

export async function toggleStudentActive(id: string, current: boolean) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await supabase.rpc('admin_toggle_student_active', {
    p_student_id: id,
    p_is_active: !current,
  })
  if (error) {
    console.error('[toggleStudentActive] RPC Error:', error)
    throw new Error('Failed to toggle status')
  }
  revalidatePath('/admin/students')
}

export async function resetStudentPassword(phone: string, newPassword: string) {
  await requireAdmin()
  if (newPassword.length < 8 || newPassword.length > 72) {
    throw new Error('invalid_password')
  }
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_reset_student_password', {
    p_phone:        phone,
    p_new_password: newPassword,
  })
  if (error || !data?.success) throw new Error(data?.error ?? 'reset_failed')

  // Update the password in Supabase Auth via the admin API
  const adminRes = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-reset-password`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ profile_id: data.profile_id, new_password: newPassword }),
    }
  )
  if (!adminRes.ok) throw new Error('auth_reset_failed')
  revalidatePath('/admin/students')
}

export async function manageStudentSubscription(params: {
  studentId: string
  action: 'activate' | 'renew' | 'revoke' | 'block'
  planType?: string
  amountPaid?: number
  currency?: string
  paymentMethod?: 'Bankily' | 'Masrivi' | 'Sedad'
  paymentReference?: string
  notes?: string
}) {
  await requireAdmin()
  const paymentMethod = params.paymentMethod
  if (paymentMethod && !['Bankily', 'Masrivi', 'Sedad'].includes(paymentMethod)) {
    throw new Error('Invalid payment method')
  }

  const supabase = await createAuthedClient()
  const { error } = await supabase.rpc('admin_manage_subscription', {
    p_student_id:        params.studentId,
    p_action:            params.action,
    p_plan_type:         params.planType,
    p_amount_paid:       params.amountPaid,
    p_currency:          params.currency,
    p_payment_method:    paymentMethod,
    p_payment_reference: params.paymentReference,
    p_notes:             params.notes,
  })
  
  if (error) {
    console.error('[manageStudentSubscription] RPC Error:', error)
    throw new Error('Failed to manage subscription: ' + error.message)
  }
  revalidatePath('/admin/students')
  revalidatePath('/admin/abonnements')
  revalidatePath('/admin')
}
