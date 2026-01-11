import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Define las rutas protegidas y públicas
const protectedPaths = ['/dashboard', '/admin', '/miembros', '/pagos', '/votos']
const publicPaths = ['/login', '/registro', '/auth', '/error']
const PUBLIC_FILE = /\.(.*)$/

function isProtectedPath(path: string) {
  return protectedPaths.some(protectedPath => path.startsWith(protectedPath))
}

function isPublicPath(path: string) {
  return publicPaths.some(publicPath => path.startsWith(publicPath))
}

function isStaticFile(path: string) {
  return PUBLIC_FILE.test(path)
}

function isApiPath(path: string) {
  return path.startsWith('/api')
}

export default async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const currentUrl = `${pathname}${search}`

  // 1. Permitir archivos estáticos y API sin verificación
  if (isStaticFile(pathname)) {
    return NextResponse.next()
  }

  // 2. Permitir rutas de API sin verificación del middleware
  if (isApiPath(pathname)) {
    return NextResponse.next()
  }

  // 3. Crear respuesta que será modificada por Supabase para refrescar cookies
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 4. Crear el cliente de Supabase para verificar la sesión
  // IMPORTANTE: Usar getAll/setAll según la documentación actualizada de @supabase/ssr
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

  try {
    // 3. Verificar la sesión y el estado del usuario en cada petición
    // Usar getUser() en lugar de getSession() para mayor seguridad
    const { data: userData, error: userError } = await supabase.auth.getUser()
    let user = userData?.user ?? null

    if (userError) {
      const errorCode = (userError as { code?: string })?.code

      if (errorCode === 'invalid_grant' || userError.message?.includes('Invalid Refresh Token')) {
        // El token de refresco es inválido o expiró: tratamos al usuario como no autenticado
        user = null
      } else {
        console.error('Error al verificar el usuario:', userError)
        user = null
      }
    }

    // 4. Si es la ruta raíz, redirigir según autenticación
    if (pathname === '/') {
      return NextResponse.redirect(
        new URL(user ? '/dashboard' : '/login', request.url)
      )
    }

    // 5. Obtener datos del usuario si está autenticado
    if (user?.id) {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('estado, rol')
        .eq('id', user.id)
        .single()

      // Si hay error al obtener datos del usuario o no está activo, cerrar sesión
      if (userError || !userData || userData.estado !== 'activo') {
        try {
          await supabase.auth.signOut()
        } catch (signOutError) {
          console.warn('Error al cerrar sesión desde middleware:', signOutError)
        }
        return NextResponse.redirect(
          new URL('/login?error=usuario_inactivo', request.url)
        )
      }

      // 6. Manejar rutas según estado de autenticación
      if (isProtectedPath(pathname)) {
        // Permitir acceso a rutas protegidas (retornar supabaseResponse para propagar cookies)
        return supabaseResponse
      }

      if (isPublicPath(pathname)) {
        // Redirigir a dashboard si intenta acceder a rutas públicas estando autenticado
        const redirectTo = request.nextUrl.searchParams.get('redirect_to')
        return NextResponse.redirect(
          new URL(redirectTo || '/dashboard', request.url)
        )
      }
    } else {
      // 7. Usuario no autenticado
      if (isProtectedPath(pathname)) {
        // Guardar la URL actual para redirección después del login
        const encodedRedirectTo = encodeURIComponent(pathname + search)
        return NextResponse.redirect(
          new URL(`/login?redirect_to=${encodedRedirectTo}`, request.url)
        )
      }

      if (isPublicPath(pathname)) {
        // Permitir acceso a rutas públicas (retornar supabaseResponse para propagar cookies)
        return supabaseResponse
      }
    }

    // 8. Para cualquier otra ruta, redirigir al login
    return NextResponse.redirect(new URL('/login', request.url))

  } catch (error) {
    console.error('Error en middleware:', error)
    
    // 9. En caso de error, redirigir al login con mensaje de error
    if (!pathname.startsWith('/login')) {
      return NextResponse.redirect(
        new URL('/login?error=error_servidor', request.url)
      )
    }
    return supabaseResponse
  }
}

// 10. Configuración de rutas que el middleware debe procesar
export const config = {
  matcher: [
    // Procesar todas las rutas excepto archivos estáticos y API
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js)$).*)',
  ],
}