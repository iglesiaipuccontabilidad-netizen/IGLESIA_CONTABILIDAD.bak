import { createClient } from '@/lib/supabase/server'
import { ComiteCard } from '@/components/comites/ComiteCard'
import Link from 'next/link'
import { Users, Plus } from 'lucide-react'
import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ComitesPage() {
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg">
          Debes iniciar sesión para ver los comités.
        </div>
      </div>
    )
  }

  // Obtener rol del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  // Obtener comités con conteos
  const { data: comites, error } = await supabase
    .from('comites')
    .select(`
      *,
      usuarios_count:comite_usuarios(count),
      miembros_count:comite_miembros(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al cargar comités:', error)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          Error al cargar los comités. Por favor, intenta de nuevo.
        </div>
      </div>
    )
  }

  // Formatear datos para incluir los conteos
  const comitesFormateados = comites?.map((comite: any) => ({
    ...comite,
    usuarios_count: comite.usuarios_count?.[0]?.count ?? 0,
    miembros_count: comite.miembros_count?.[0]?.count ?? 0,
  })) ?? []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            Comités
          </h1>
          <p className="text-slate-600 mt-2">
            Gestiona los comités de la iglesia y su contabilidad independiente
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/dashboard/comites/nuevo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Nuevo Comité
            </Link>
          )}
          <LogoutButton />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Comités</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {comitesFormateados.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Activos</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                {comitesFormateados.filter((c) => c.estado === 'activo').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Inactivos</p>
              <p className="text-3xl font-bold text-slate-400 mt-1">
                {comitesFormateados.filter((c) => c.estado === 'inactivo').length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-slate-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Comités */}
      {comitesFormateados.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No hay comités creados
          </h3>
          <p className="text-slate-600 mb-6">
            Crea el primer comité para comenzar a gestionar su contabilidad
          </p>
          {isAdmin && (
            <Link
              href="/dashboard/comites/nuevo"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Crear Primer Comité
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comitesFormateados.map((comite) => (
            <ComiteCard key={comite.id} comite={comite} />
          ))}
        </div>
      )}
    </div>
  )
}
