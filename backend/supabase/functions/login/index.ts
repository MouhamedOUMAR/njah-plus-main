import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizePhone, MAURITANIAN_PHONE } from '../_shared/auth.ts'

/**
 * login: Authenticates a user with phone + password via Supabase Auth.
 *
 * Steps:
 *  1. Look up profile by phone — check it exists and is active
 *  2. Detect legacy accounts (profile exists but no auth.users row)
 *  3. signInWithPassword using phone number (222XXXXXXXX)
 *  4. Return { success: true, session: { access_token, refresh_token } }
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function log(step: string, data?: Record<string, unknown>) {
  console.log(JSON.stringify({ fn: 'login', step, ts: new Date().toISOString(), ...data }))
}
function logError(step: string, err: unknown, extra?: Record<string, unknown>) {
  console.error(JSON.stringify({
    fn: 'login', step, ts: new Date().toISOString(),
    error: err instanceof Error ? err.message : String(err), ...extra,
  }))
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}
function errorResponse(error: string, status: number, details?: string): Response {
  return jsonResponse({ success: false, error, ...(details ? { details } : {}) }, status)
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

  let phone: string
  let password: string
  try {
    const body = await req.json()
    phone    = normalizePhone(body?.phone ?? '')
    password = (body?.password ?? '')
  } catch (err) {
    logError('parse_body', err)
    return errorResponse('invalid_request_body', 400)
  }

  if (!MAURITANIAN_PHONE.test(phone)) return errorResponse('invalid_phone', 400)
  if (!password)                      return errorResponse('missing_password', 400)

  log('input_parsed', { phone_prefix: phone.slice(0, 6) })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const publicClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // ── 1. Check profile exists and is active ─────────────────────────────────
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('id, is_active')
    .eq('phone', phone)
    .maybeSingle()

  if (profileErr) {
    logError('profile_fetch_error', profileErr)
    return errorResponse('db_error', 500)
  }

  if (!profile)           return errorResponse('invalid_credentials', 401, 'Numéro ou mot de passe incorrect.')
  if (!profile.is_active) return errorResponse('account_inactive',    403, 'Ce compte a été désactivé. Contacte le support.')

  log('profile_found', { user_id: profile.id })

  // ── 2. Detect legacy accounts (profile exists but no auth.users row) ──────
  const { data: existingAuthUser } = await admin.auth.admin.getUserById(profile.id)
  if (!existingAuthUser?.user) {
    log('legacy_account_detected', { user_id: profile.id })
    return errorResponse('legacy_account_needs_reset', 403,
      'Compte ancien détecté. Réinscris-toi avec le même numéro pour créer ton nouveau mot de passe.')
  }

  // ── 3. Sign in via Supabase Auth (native phone auth) ────────
  let { data: authData, error: signInErr } = await publicClient.auth.signInWithPassword({
    phone,
    password,
  })

  if (signInErr || !authData?.session) {
    log('sign_in_failed', { message: signInErr?.message })
    return errorResponse('invalid_credentials', 401, 'Numéro ou mot de passe incorrect.')
  }

  log('success', { user_id: profile.id })

  return jsonResponse({
    success: true,
    session: {
      access_token:  authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    },
  })
}
