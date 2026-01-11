import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/lib/database.types'

// Función auxiliar para crear redirecciones
function createRedirect(request: NextRequest, path: string) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = path
  return NextResponse.redirect(redirectUrl)
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = ['/login', '/registro', '/auth', '/error']
  const isPublicRoute = publicRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  // Si no hay usuario y no estamos en ruta pública, redirigir a login
  if (!user?.id && !isPublicRoute) {
    return createRedirect(request, '/login')
  }

  // Si hay usuario y no estamos en ruta pública
  if (user?.id && !isPublicRoute) {
    const userId = user.id

    // Verificar si el usuario existe en la tabla de miembros
    const { error: memberError } = await supabase
      .from('miembros')
      .select('id')
      .eq('id', userId)
      .single()

    if (memberError) {
      return createRedirect(request, '/login')
    }

    // Verificar acceso a rutas admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      type UserRole = { rol: 'admin' | 'usuario' | 'pendiente' }
      const { data: userData } = await supabase
        .from('usuarios')
        .select('rol')
        .eq('id', userId)
        .maybeSingle<UserRole>()

      if (!userData || userData.rol !== 'admin') {
        return createRedirect(request, '/dashboard')
      }
    }
  }

  return supabaseResponse
}
