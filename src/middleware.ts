import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Crear una respuesta inicial que se modificará según sea necesario
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Crear el cliente de Supabase con manejo de cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  try {
    // IMPORTANTE: Verificar el usuario mediante Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Lista de rutas públicas que no requieren autenticación
    const publicRoutes = ['/login', '/registro', '/auth', '/error']
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Redirigir a login si no hay usuario y no es ruta pública
    if (!user && !isPublicRoute) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // Redirigir a dashboard si hay usuario y está en rutas de auth
    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/registro')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Si todo está bien, devolver la respuesta con las cookies actualizadas
    return supabaseResponse
  } catch (error) {
    console.error('Error in middleware:', error)
    // En caso de error, continuar con la solicitud pero mantener las cookies actualizadas
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}