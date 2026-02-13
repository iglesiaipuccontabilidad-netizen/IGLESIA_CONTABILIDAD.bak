import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { encodeValue } from '@/lib/utils/supabaseWithTimeout'

// First-level paths that are NEVER org slugs
const SYSTEM_PATHS = new Set([
  'dashboard', 'login', 'registro', 'auth', 'error',
  'api', '_next', 'forgot-password', 'reset-password',
])

/** Copy all cookies from one response to another */
function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options as any)
  })
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ── 1. Detect org-slug URL pattern: /<slug>/dashboard[/...] ──
  const slugMatch = pathname.match(/^\/([^/]+)(\/dashboard(?:\/.*)?)$/)
  const urlSlug = slugMatch && !SYSTEM_PATHS.has(slugMatch[1]) ? slugMatch[1] : null
  const rewritePath = urlSlug ? slugMatch![2] : null

  // ── 2. Public route detection ──
  const publicRoutes = ['/login', '/auth', '/forgot-password', '/reset-password', '/registro']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // ── 3. Supabase client + auth ──
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
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

  const { data: { user } } = await supabase.auth.getUser()

  // ── 4. Pre-load org data for authenticated users ──
  let userOrgSlug: string | null = null

  const cookieOptions = {
    path: '/',
    maxAge: 604800,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  }

  if (user && !isPublicRoute) {
    try {
      // Fetch ALL org memberships with slugs (multi-org support)
      const { data: orgMemberships } = await supabase
        .from('organizacion_usuarios')
        .select('rol, estado, organizacion_id, organizaciones!inner(slug)')
        .eq('usuario_id', user.id)
        .eq('estado', 'activo')

      // Determine active org: prefer URL slug match, else first membership
      let activeOrg = orgMemberships?.[0] || null
      if (urlSlug && orgMemberships) {
        const matched = orgMemberships.find(
          (m: any) => m.organizaciones?.slug === urlSlug
        )
        if (matched) activeOrg = matched
      }

      // Fallback to usuarios table (legacy / no org membership)
      const userData = activeOrg || (await supabase
        .from('usuarios')
        .select('rol, estado')
        .eq('id', user.id)
        .maybeSingle()).data

      if (userData) {
        supabaseResponse.headers.set('X-User-Rol', userData.rol || 'sin_rol')
        supabaseResponse.headers.set('X-User-Estado', userData.estado || 'pendiente')
        supabaseResponse.cookies.set('__auth_user_rol', encodeValue(userData.rol || 'sin_rol'), cookieOptions)
        supabaseResponse.cookies.set('__auth_user_estado', encodeValue(userData.estado || 'pendiente'), cookieOptions)
        supabaseResponse.cookies.set('__auth_user_id', encodeValue(user.id), cookieOptions)
        if (user.email) {
          supabaseResponse.cookies.set('__auth_user_email', encodeValue(user.email), cookieOptions)
        }
      }

      if (activeOrg) {
        userOrgSlug = (activeOrg as any).organizaciones?.slug || null
        const activeOrgId = activeOrg.organizacion_id
        if (activeOrgId) {
          supabaseResponse.cookies.set('__auth_org_id', encodeValue(activeOrgId), cookieOptions)
        }
        if (userOrgSlug) {
          supabaseResponse.cookies.set('__auth_org_slug', userOrgSlug, cookieOptions)
        }
      }
    } catch (err) {
      console.warn('⚠️ [Middleware] Error al precargar org:', err)
    }
  }

  // ── 5. Routing decisions ──

  // 5a. No user + protected route → login
  if (!user && !isPublicRoute && pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 5b. User at /login → redirect to org dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = userOrgSlug ? `/${userOrgSlug}/dashboard` : '/dashboard'
    const response = NextResponse.redirect(url)
    copyCookies(supabaseResponse, response)
    return response
  }

  // 5c. Root → redirect
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = user
      ? (userOrgSlug ? `/${userOrgSlug}/dashboard` : '/dashboard')
      : '/login'
    const response = NextResponse.redirect(url)
    copyCookies(supabaseResponse, response)
    return response
  }

  // 5d. /<slug>/dashboard/... → validate slug and rewrite
  if (urlSlug && user) {
    if (userOrgSlug === urlSlug && rewritePath) {
      // Valid slug — rewrite to /dashboard/...
      const url = request.nextUrl.clone()
      url.pathname = rewritePath
      const response = NextResponse.rewrite(url)
      copyCookies(supabaseResponse, response)
      return response
    } else {
      // Invalid slug → redirect to user's default org
      const url = request.nextUrl.clone()
      url.pathname = userOrgSlug ? `/${userOrgSlug}/dashboard` : '/dashboard'
      const response = NextResponse.redirect(url)
      copyCookies(supabaseResponse, response)
      return response
    }
  }

  // 5e. Bare /dashboard/... → redirect to /<slug>/dashboard/...
  if (pathname.startsWith('/dashboard') && user && userOrgSlug) {
    const url = request.nextUrl.clone()
    url.pathname = `/${userOrgSlug}${pathname}`
    url.search = request.nextUrl.search
    const response = NextResponse.redirect(url)
    copyCookies(supabaseResponse, response)
    return response
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
