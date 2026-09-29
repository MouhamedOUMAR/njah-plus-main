import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MIN_PASSWORD_LENGTH = 8

function sha256Hex(input: string) {
  return createHash('sha256').update(input).digest('hex')
}

export async function POST(req: Request) {
  try {
    const { phoneVerifiedToken, newPassword } = await req.json()

    if (typeof phoneVerifiedToken !== 'string' || !phoneVerifiedToken) {
      return NextResponse.json({ error: 'missing_verification_token' }, { status: 400 })
    }

    if (
      typeof newPassword !== 'string' ||
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > 72
    ) {
      return NextResponse.json({ error: 'weak_password' }, { status: 400 })
    }

    const supabase = await createClient()
    const tokenHash = sha256Hex(phoneVerifiedToken)

    const { data: verification, error: verificationError } = await supabase
      .from('phone_verifications')
      .select('id, phone, expires_at, used')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (verificationError) {
      return NextResponse.json({ error: 'verification_failed' }, { status: 500 })
    }

    if (!verification || verification.used || new Date() > new Date(verification.expires_at)) {
      return NextResponse.json({ error: 'verification_token_invalid' }, { status: 400 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', verification.phone)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: 'profile_lookup_failed' }, { status: 500 })
    }

    if (!profile?.id) {
      return NextResponse.json({ error: 'profile_not_found' }, { status: 404 })
    }

    const { data: consumedVerification, error: consumeError } = await supabase
      .from('phone_verifications')
      .update({ used: true })
      .eq('id', verification.id)
      .eq('used', false)
      .select('id')
      .maybeSingle()

    if (consumeError || !consumedVerification) {
      return NextResponse.json({ error: 'verification_token_invalid' }, { status: 400 })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(profile.id, {
      password: newPassword,
    })

    if (updateError) {
      return NextResponse.json({ error: 'password_reset_failed' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
