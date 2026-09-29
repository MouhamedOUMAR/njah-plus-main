import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = new Set([
  '/',
  '/landing',
  '/login',
  '/verify-otp',
  '/register',
  '/forgot-password',
  '/suspended',
])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/icon') ||
    pathname.startsWith('/icons/') ||
    pathname === '/apple-icon' ||
    pathname === '/manifest.webmanifest' ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser validates the JWT with Supabase before authorization decisions.
  const { data: { user } } = await supabase.auth.getUser()
  const isPublicPath = PUBLIC_PATHS.has(pathname)

  if (!user) {
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  const { data: profile } = await supabase.rpc('get_my_auth_status')

  if (!profile) {
    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return supabaseResponse
  }

  if (!profile.is_active && pathname !== '/suspended') {
    return NextResponse.redirect(new URL('/suspended', request.url))
  }

  if (profile.is_active) {
    if (pathname === '/login' || pathname === '/register' || pathname === '/verify-otp') {
      const destination = profile.role === 'admin' ? '/admin' : '/dashboard'
      return NextResponse.redirect(new URL(destination, request.url))
    }

    if (pathname.startsWith('/admin') && profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (pathname.startsWith('/dashboard') && profile.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
