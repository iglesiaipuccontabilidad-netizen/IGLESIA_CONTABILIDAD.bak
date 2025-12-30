import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  UserCog,
  Calendar,
  Activity,
  Plus,
  DollarSign,
} from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function ComiteDetallePage({ params }: PageProps) {
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  // Obtener rol del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  // Obtener comité con información relacionada
  const { data: comite, error } = await supabase
    .from('comites')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !comite) {
    console.error('Error al cargar comité:', error)
    return notFound()
  }

  // Obtener usuarios del comité
  const { data: usuarios } = await supabase
    .from('comite_usuarios')
    .select(`
      *,
      usuario:usuarios(id, nombres, apellidos, email)
    `)
    .eq('comite_id', params.id)
    .eq('estado', 'activo')
    .order('fecha_ingreso', { ascending: false })

  // Obtener miembros del comité
  const { data: miembros } = await supabase
    .from('comite_miembros')
    .select('*')
    .eq('comite_id', params.id)
    .eq('estado', 'activo')
    .order('apellidos', { ascending: true })

  // Obtener balance del comité (usando la función SQL)
  const { data: balanceData } = await supabase.rpc('obtener_balance_comite', {
    p_comite_id: params.id,
  })

  const balance = (Array.isArray(balanceData) ? balanceData[0] : balanceData) as { balance: number; total_ingresos: number; total_egresos: number } || { balance: 0, total_ingresos: 0, total_egresos: 0 }

  const isActivo = comite.estado === 'activo'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/comites"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Comités
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900">{comite.nombre}</h1>
              <span
                className={`
                px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1
                ${
                  isActivo
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }
              `}
              >
                <Activity className="w-3 h-3" />
                {isActivo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {comite.descripcion && (
              <p className="text-slate-600 mt-2">{comite.descripcion}</p>
            )}
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Creado el{' '}
              {new Date(comite.created_at).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <Link
                href={`/dashboard/comites/${params.id}/editar`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </Link>
              <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Balance Actual</span>
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-primary-600">
            ${balance.balance?.toLocaleString('es-CO', { minimumFractionDigits: 0 }) ?? '0'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Ingresos</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            ${balance.total_ingresos?.toLocaleString('es-CO', { minimumFractionDigits: 0 }) ?? '0'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Egresos</span>
            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <p className="text-3xl font-bold text-rose-600">
            ${balance.total_egresos?.toLocaleString('es-CO', { minimumFractionDigits: 0 }) ?? '0'}
          </p>
        </div>
      </div>

      {/* Usuarios del Comité */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary-600" />
            Usuarios del Sistema ({usuarios?.length ?? 0})
          </h2>
          {isAdmin && (
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" />
              Asignar Usuario
            </button>
          )}
        </div>

        {!usuarios || usuarios.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <UserCog className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>No hay usuarios asignados a este comité</p>
          </div>
        ) : (
          <div className="space-y-3">
            {usuarios.map((cu: any) => (
              <div
                key={cu.id}
                className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-sm">
                      {cu.usuario?.nombres?.charAt(0) ?? ''}
                      {cu.usuario?.apellidos?.charAt(0) ?? ''}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {cu.usuario?.nombres} {cu.usuario?.apellidos}
                    </p>
                    <p className="text-sm text-slate-500">{cu.usuario?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${
                      cu.rol === 'lider'
                        ? 'bg-purple-50 text-purple-700'
                        : cu.rol === 'tesorero'
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-slate-50 text-slate-700'
                    }
                  `}
                  >
                    {cu.rol === 'lider'
                      ? 'Líder'
                      : cu.rol === 'tesorero'
                      ? 'Tesorero'
                      : 'Secretario'}
                  </span>
                  {isAdmin && (
                    <button className="text-rose-500 hover:text-rose-700 p-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Miembros del Comité */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-600" />
            Miembros del Comité ({miembros?.length ?? 0})
          </h2>
          <Link
            href={`/dashboard/comites/${params.id}/miembros`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Gestionar Miembros
          </Link>
        </div>

        {!miembros || miembros.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>No hay miembros en este comité</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {miembros.slice(0, 6).map((miembro: any) => (
              <div
                key={miembro.id}
                className="p-4 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <p className="font-medium text-slate-900">
                  {miembro.nombres} {miembro.apellidos}
                </p>
                {miembro.telefono && (
                  <p className="text-sm text-slate-500 mt-1">{miembro.telefono}</p>
                )}
              </div>
            ))}
            {miembros.length > 6 && (
              <Link
                href={`/dashboard/comites/${params.id}/miembros`}
                className="p-4 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors flex items-center justify-center text-primary-600 font-medium"
              >
                Ver todos ({miembros.length})
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
