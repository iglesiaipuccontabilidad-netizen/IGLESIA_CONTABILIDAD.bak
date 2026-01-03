import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp } from 'lucide-react'
import { ComiteOfrendaForm } from '@/components/comites/ComiteOfrendaForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function NuevaOfrendaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  try {
    // Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    console.log('🔍 NuevaOfrendaPage - Usuario autenticado:', user.id)

    // Obtener rol del usuario
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('❌ Error al obtener datos del usuario:', userError)
      throw new Error(`Error al obtener datos del usuario: ${userError.message}`)
    }

    const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

    console.log('🔍 NuevaOfrendaPage - Rol del usuario:', userData?.rol, 'isAdmin:', isAdmin)

  // Verificar acceso al comité
  let hasAccess = isAdmin
  let rolEnComite = null

  if (!isAdmin) {
    const { data: comiteUsuario, error: comiteUsuarioError } = await supabase
      .from('comite_usuarios')
      .select('rol')
      .eq('comite_id', id)
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .single()

    if (comiteUsuarioError && comiteUsuarioError.code !== 'PGRST116') {
      console.error('❌ Error al verificar acceso al comité:', comiteUsuarioError)
      throw new Error(`Error al verificar acceso al comité: ${comiteUsuarioError.message}`)
    }

    hasAccess = !!comiteUsuario
    rolEnComite = comiteUsuario?.rol

    console.log('🔍 NuevaOfrendaPage - Acceso al comité:', { hasAccess, rolEnComite })
  }

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  console.log('🔍 NuevaOfrendaPage - Permisos finales:', { canManage, isAdmin, rolEnComite })

  if (!hasAccess || !canManage) {
    console.log('🚫 NuevaOfrendaPage - Usuario sin permisos')
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes permisos para registrar ofrendas en este comité.
        </div>
      </div>
    )
  }

  // Obtener comité
  const { data: comite, error: comiteError } = await supabase
    .from('comites')
    .select('nombre')
    .eq('id', id)
    .single()

  if (comiteError) {
    console.error('❌ Error al cargar comité:', comiteError)
    throw new Error(`Error al cargar comité: ${comiteError.message}`)
  }

  if (!comite) {
    console.log('🚫 NuevaOfrendaPage - Comité no encontrado')
    return notFound()
  }

  console.log('✅ NuevaOfrendaPage - Todo OK, renderizando página')

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${id}/ofrendas`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Ofrendas
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Nueva Ofrenda</h1>
            <p className="text-slate-600 mt-1">{comite.nombre}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Registrar Ingreso</h2>
          <p className="text-sm text-slate-600">
            Completa los datos de la ofrenda o ingreso recibido
          </p>
        </div>

        <ComiteOfrendaForm comiteId={id} />
      </div>
    </div>
  )
  } catch (error) {
    console.error('❌ Error crítico en NuevaOfrendaPage:', error)
    
    // En desarrollo, mostrar el error completo
    if (process.env.NODE_ENV === 'development') {
      throw error
    }
    
    // En producción, mostrar página de error genérica
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-6 rounded-lg border border-rose-200">
          <h2 className="text-lg font-semibold mb-2">Error al cargar la página</h2>
          <p className="text-sm">
            Ha ocurrido un error al cargar la página de nueva ofrenda. 
            Por favor, intenta recargar la página o contacta al administrador si el problema persiste.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium">Detalles técnicos</summary>
              <pre className="mt-2 text-xs bg-rose-100 p-2 rounded overflow-auto">
                {error instanceof Error ? error.message : 'Error desconocido'}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}
