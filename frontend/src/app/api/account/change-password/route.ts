import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createAuthedClient } from '@/lib/supabase/server'

const MIN_PASSWORD_LENGTH = 8

export async function POST(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json()

    if (typeof currentPassword !== 'string' || !currentPassword) {
      return NextResponse.json({ error: 'current_password_required' }, { status: 400 })
    }

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > 72
    ) {
      return NextResponse.json({ error: 'weak_password' }, { status: 400 })
    }

    const supabase = await createAuthedClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
    }

    const phone = user.phone
    if (!phone) {
      return NextResponse.json({ error: 'missing_phone' }, { status: 400 })
    }

    const publicClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { error: signInError } = await publicClient.auth.signInWithPassword({
      phone,
      password: currentPassword,
    })

    if (signInError) {
      return NextResponse.json({ error: 'invalid_current_password' }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      return NextResponse.json({ error: 'password_update_failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
