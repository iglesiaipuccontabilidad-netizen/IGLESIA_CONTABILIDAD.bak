import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { encodeValue } from '@/lib/utils/supabaseWithTimeout'

// First-level paths that are NEVER org slugs
const SYSTEM_PATHS = new Set([
  'dashboard', 'login', 'registro', 'registro-org', 'invitacion',
  'auth', 'error', 'api', '_next', 'forgot-password', 'reset-password',
  'pendiente-aprobacion', 'super-admin',
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
  const publicRoutes = ['/login', '/auth', '/forgot-password', '/reset-password', '/registro', '/registro-org', '/invitacion', '/pendiente-aprobacion']
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
  let orgEstado: string | null = null

  const cookieOptions = {
    path: '/',
    maxAge: 604800,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  }

  if (user && !isPublicRoute) {
    try {
      // Fetch ALL org memberships with slugs + org estado (multi-org support)
      const { data: orgMemberships } = await supabase
        .from('organizacion_usuarios')
        .select('rol, estado, organizacion_id, organizaciones!inner(slug, estado)')
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

      // Fallback to organizacion_usuarios table
      const userData = activeOrg || (await supabase
        .from('organizacion_usuarios')
        .select('rol, estado')
        .eq('usuario_id', user.id)
        .eq('estado', 'activo')
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
        orgEstado = (activeOrg as any).organizaciones?.estado || null
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

  // 5-pre. Org pendiente/rechazada/suspendida → redirigir a /pendiente-aprobacion
  // (excepto si va a /super-admin, /pendiente-aprobacion, o rutas públicas)
  if (
    user &&
    orgEstado &&
    orgEstado !== 'activo' &&
    !pathname.startsWith('/super-admin') &&
    !pathname.startsWith('/pendiente-aprobacion') &&
    !isPublicRoute &&
    (pathname.startsWith('/dashboard') || urlSlug)
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/pendiente-aprobacion'
    url.search = userOrgSlug ? `?org=${userOrgSlug}` : ''
    const response = NextResponse.redirect(url)
    copyCookies(supabaseResponse, response)
    return response
  }

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

  // 5c. Root → allow public landing at '/' — redirect only for authenticated users
  if (pathname === '/') {
    // Authenticated users continue to their dashboard
    if (user) {
      const url = request.nextUrl.clone()
      url.pathname = userOrgSlug ? `/${userOrgSlug}/dashboard` : '/dashboard'
      const response = NextResponse.redirect(url)
      copyCookies(supabaseResponse, response)
      return response
    }

    // Unauthenticated users: let the request proceed so `/` can serve the public landing
    return supabaseResponse
  }

  // 5d. /<slug>/dashboard/... → validate slug ownership
  // URL rewriting is handled by next.config.mjs rewrites (works for client-side nav)
  // Middleware only validates the slug and redirects if invalid
  if (urlSlug && user) {
    if (userOrgSlug === urlSlug) {
      // Valid slug — let next.config.mjs rewrite handle URL mapping
      // Just pass through with auth cookies already set
      return supabaseResponse
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
