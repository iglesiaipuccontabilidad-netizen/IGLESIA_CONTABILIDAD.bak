import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { encodeValue } from '@/lib/utils/supabaseWithTimeout'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: Esto refresca la sesión si es necesario
  // Usar getUser() es más seguro que getSession() ya que valida el JWT contra el servidor
  const { data: { user }, error } = await supabase.auth.getUser()

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/login', '/auth', '/forgot-password', '/reset-password']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )
  
  // FASE 2: Pre-cargar rol del usuario para optimizar AuthContext
  if (user && !isPublicRoute) {
    try {
      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol, estado')
        .eq('id', user.id)
        .maybeSingle()
      
      if (userData) {
        // Agregar headers personalizados con el rol
        supabaseResponse.headers.set('X-User-Rol', userData.rol || 'sin_rol')
        supabaseResponse.headers.set('X-User-Estado', userData.estado || 'pendiente')
        
        // Setear cookies con formato compatible con AuthContext
        // Esto evita que el cliente tenga que hacer queries directas a Supabase
        const cookieOptions = {
          path: '/',
          maxAge: 604800, // 7 días
          sameSite: 'lax' as const,
          secure: process.env.NODE_ENV === 'production',
          httpOnly: false, // El cliente necesita leerlas via document.cookie
        }
        supabaseResponse.cookies.set('__auth_user_rol', encodeValue(userData.rol || 'sin_rol'), cookieOptions)
        supabaseResponse.cookies.set('__auth_user_estado', encodeValue(userData.estado || 'pendiente'), cookieOptions)
        supabaseResponse.cookies.set('__auth_user_id', encodeValue(user.id), cookieOptions)
        if (user.email) {
          supabaseResponse.cookies.set('__auth_user_email', encodeValue(user.email), cookieOptions)
        }
        console.log('✅ [Middleware] Rol precargado en cookies:', userData.rol)
      }
    } catch (err) {
      // No fallar el middleware si falla la precarga del rol
      console.warn('⚠️ [Middleware] Error al precargar rol:', err)
    }
  }

  // Si no hay usuario y no es ruta pública, redirigir a login
  if (!user && !isPublicRoute && request.nextUrl.pathname !== '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay usuario y está en login, redirigir a dashboard
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Si está en la raíz, redirigir según autenticación
  if (request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = user ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
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
