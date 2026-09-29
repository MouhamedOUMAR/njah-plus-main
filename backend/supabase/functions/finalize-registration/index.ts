import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { MAURITANIAN_PHONE } from '../_shared/auth.ts'

/**
 * finalize-registration
 *
 * Completes registration after OTP verification.
 * Passwords are managed entirely by Supabase Auth — no custom hashing.
 *
 *  Case A — no profile with this phone → create profile + auth user
 *  Case B — profile exists AND auth user exists → already registered
 *  Case C — profile exists but no auth user → resume (set password)
 */

const MIN_PASSWORD_LEN = 8
const MAX_PASSWORD_LEN = 72
const MAX_NAME_LEN = 120

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function log(step: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ fn: 'finalize-registration', step, ts: new Date().toISOString(), ...data }))
}
function logError(step: string, err: unknown, extra?: Record<string, unknown>) {
  console.error(JSON.stringify({
    fn: 'finalize-registration', step, ts: new Date().toISOString(),
    error: err instanceof Error ? err.message : String(err), ...extra,
  }))
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
function errorResponse(error: string, status: number, details?: unknown): Response {
  return jsonResponse({ success: false, error, ...(details ? { details } : {}) }, status)
}

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'POST')   return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS })
  log('request_received')
  try { return await handleRequest(req) }
  catch (err) {
    logError('unhandled_exception', err)
    return errorResponse('internal_error', 500, err instanceof Error ? err.message : String(err))
  }
})

async function handleRequest(req: Request): Promise<Response> {

  const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const SUPABASE_ANON_KEY         = Deno.env.get('SUPABASE_ANON_KEY')
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    logError('missing_env', 'Supabase secrets not set')
    return errorResponse('missing_env_vars', 500)
  }

  let phoneVerifiedToken: string
  let password: string
  let name: string
  try {
    const body         = await req.json()
    phoneVerifiedToken = (body?.phone_verified_token ?? '').trim()
    password           = (body?.password ?? '')
    name               = (body?.name ?? '').trim()
  } catch (err) {
    logError('parse_body', err)
    return errorResponse('invalid_request_body', 400)
  }

  if (!phoneVerifiedToken)                return errorResponse('missing_verification_token', 400)
  if (!name || name.length > MAX_NAME_LEN) return errorResponse('invalid_name', 400)
  if (password.length < MIN_PASSWORD_LEN || password.length > MAX_PASSWORD_LEN) {
    return errorResponse('weak_password', 400,
      `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LEN} caractères.`)
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── Validate OTP token ────────────────────────────────────────────────────
  const tokenHash = await sha256Hex(phoneVerifiedToken)
  const { data: verification, error: verifyErr } = await admin
    .from('phone_verifications')
    .select('id, phone, expires_at, used')
    .eq('token_hash', tokenHash)
    .maybeSingle()

  if (verifyErr) { logError('verification_fetch_error', verifyErr); return errorResponse('db_error', 500, verifyErr) }
  if (!verification)                                   return errorResponse('verification_token_invalid', 400)
  if (verification.used)                               return errorResponse('verification_token_used', 400)
  if (new Date() > new Date(verification.expires_at))  return errorResponse('verification_token_expired', 400)

  const { data: consumedVerification, error: consumeErr } = await admin
    .from('phone_verifications')
    .update({ used: true })
    .eq('id', verification.id)
    .eq('used', false)
    .select('id')
    .maybeSingle()

  if (consumeErr) {
    logError('verification_consume_error', consumeErr)
    return errorResponse('db_error', 500)
  }
  if (!consumedVerification) return errorResponse('verification_token_used', 400)

  const phone = verification.phone
  if (!MAURITANIAN_PHONE.test(phone)) return errorResponse('invalid_phone', 400)

  // ── Resolve profile ───────────────────────────────────────────────────────
  const { data: existingProfile, error: profileErr } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (profileErr) { logError('profile_fetch_error', profileErr); return errorResponse('db_error', 500, profileErr) }

  let userId: string

  if (existingProfile?.id) {
    userId = existingProfile.id
    // Check if auth user already exists (= already fully registered)
    const { data: existingAuthUser } = await admin.auth.admin.getUserById(userId)
    if (existingAuthUser?.user?.confirmed_at) {
      log('case_b_already_registered')
      return errorResponse('phone_already_registered', 409,
        'Un compte avec ce numéro existe déjà. Connecte-toi.')
    }
    log('case_c_resume', { user_id: userId })
  } else {
    // New user — generate ID
    userId = crypto.randomUUID()
    log('case_a_new_user', { user_id: userId })
  }

  // ── Create or update Supabase Auth user (native phone auth) ────────
  // MUST BE DONE BEFORE PROFILES INSERT DUE TO FOREIGN KEY CONSTRAINT `profiles_id_fkey`
  const { error: createErr } = await admin.auth.admin.createUser({
    id:            userId,
    phone:         phone,
    phone_confirm: true,
    password,
  })

  if (createErr) {
    const isExists = createErr.message?.includes('already') ||
      (createErr as unknown as { status?: number }).status === 422
    if (isExists) {
      const { error: updateErr } = await admin.auth.admin.updateUserById(userId, { password })
      if (updateErr) { logError('auth_update_failed', updateErr); return errorResponse('auth_setup_failed', 500, updateErr) }
    } else {
      logError('auth_create_failed', createErr)
      return errorResponse('auth_setup_failed', 500, createErr)
    }
  }

  // ── Ensure profiles row exists ─────────────────────────────────────────────
  if (!existingProfile?.id) {
    const { error: insertErr } = await admin.from('profiles').insert({
      id:    userId,
      phone: phone,
      role:  'student',
      full_name: name,
      subscription_status: 'none',
      subscription_plan: null,
      subscription_expires_at: null
    })
    if (insertErr) { logError('profile_insert_failed', insertErr); return errorResponse('db_error', 500, insertErr.message) }
  } else {
    // Update existing profile name
    const { error: updateErr } = await admin.from('profiles').update({
      full_name: name,
      subscription_status: 'none' // Reset if resuming? User said set these on registration
    }).eq('id', userId)
    if (updateErr) { logError('profile_update_failed', updateErr); return errorResponse('db_error', 500, updateErr.message) }
  }

  // ── Ensure student_profiles row exists ────────────────────────────────────
  const { error: spErr } = await admin
    .from('student_profiles')
    .upsert({ profile_id: userId }, { onConflict: 'profile_id', ignoreDuplicates: true })
  if (spErr) logError('student_profiles_upsert', spErr)

  // ── Mark OTP token used ───────────────────────────────────────────────────


  // ── Sign in to get JWT session ────────────────────────────────────────────
  let { data: authData, error: signInErr } = await publicClient.auth.signInWithPassword({
    phone: phone,
    password,
  })

  if (signInErr || !authData?.session) {
    logError('sign_in_failed', signInErr)
    return errorResponse('sign_in_failed', 500, signInErr)
  }

  log('success', { user_id: userId })

  return jsonResponse({
    success: true,
    session: {
      access_token:  authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    },
  })
}
