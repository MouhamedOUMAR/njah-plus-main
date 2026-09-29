import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * admin-reset-password
 * Called server-side only (service role key required).
 * Updates a user's password in Supabase Auth by profile_id.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: 'service_not_configured' }, 500)
  }

  if (req.headers.get('authorization') !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return json({ error: 'forbidden' }, 403)
  }

  let profile_id: unknown
  let new_password: unknown
  try {
    const body = await req.json()
    profile_id = body?.profile_id
    new_password = body?.new_password
  } catch {
    return json({ error: 'invalid_request' }, 400)
  }

  if (typeof profile_id !== 'string' || !profile_id) return json({ error: 'missing_fields' }, 400)
  if (typeof new_password !== 'string' || new_password.length < 8 || new_password.length > 72) {
    return json({ error: 'invalid_password' }, 400)
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await admin.auth.admin.updateUserById(profile_id, {
    password: new_password,
  })

  if (error) return json({ error: error.message }, 500)
  return json({ success: true })
})
