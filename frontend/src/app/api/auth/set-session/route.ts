import { NextResponse } from 'next/server'

// Deprecated — session is now set client-side via supabase.auth.setSession()
export async function POST() {
  return NextResponse.json({ error: 'deprecated' }, { status: 410 })
}
