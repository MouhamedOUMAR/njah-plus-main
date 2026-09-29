import { NextResponse } from 'next/server'

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> | { action: string } }) {
  // Await params if it's a promise (Next.js 15+ pattern)
  const resolvedParams = await params
  const { action } = resolvedParams

  const allowedActions = ['login', 'finalize-registration', 'send-otp', 'verify-otp']
  
  if (!allowedActions.includes(action)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const body = await req.json()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // Proxy the request server-side to bypass client-side CORS/ISP blocks
    const response = await fetch(`${supabaseUrl}/functions/v1/${action}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`
      },
      body: JSON.stringify(body)
    })

    const data = await response.json().catch(() => null)
    
    if (!response.ok) {
      console.error(`[auth-proxy ${action}] Edge function returned status:`, response.status, data)
    }

    // Return exactly what the edge function returns
    return NextResponse.json(data || { error: 'Empty response from server' }, { status: response.status })
  } catch (err) {
    console.error(`[auth-proxy ${action}] Error:`, err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
