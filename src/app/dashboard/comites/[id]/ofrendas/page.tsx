import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Plus, Calendar, DollarSign } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function OfrendasComitePage({ params }: PageProps) {
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

  // Verificar acceso al comité
  let hasAccess = isAdmin
  let rolEnComite = null

  if (!isAdmin) {
    const { data: comiteUsuario } = await supabase
      .from('comite_usuarios')
      .select('rol')
      .eq('comite_id', params.id)
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .single()

    hasAccess = !!comiteUsuario
    rolEnComite = comiteUsuario?.rol
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes acceso a este comité.
        </div>
      </div>
    )
  }

  // Obtener comité
  const { data: comite, error: comiteError } = await supabase
    .from('comites')
    .select('*')
    .eq('id', params.id)
    .single()

  if (comiteError || !comite) {
    console.error('Error al cargar comité:', comiteError)
    return notFound()
  }

  // Obtener ofrendas del comité
  const { data: ofrendas, error: ofrendasError } = await supabase
    .from('comite_ofrendas')
    .select('*')
    .eq('comite_id', params.id)
    .order('fecha', { ascending: false })

  if (ofrendasError) {
    console.error('Error al cargar ofrendas:', ofrendasError)
  }

  // Calcular estadísticas
  const totalOfrendas = ofrendas?.length || 0
  const montoTotal = ofrendas?.reduce((sum, o) => sum + o.monto, 0) || 0

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${params.id}/dashboard`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              Ofrendas: {comite.nombre}
            </h1>
            <p className="text-slate-600 mt-2">
              Gestiona los ingresos y ofrendas del comité
            </p>
          </div>

          {canManage && (
            <Link
              href={`/dashboard/comites/${params.id}/ofrendas/nueva`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Nueva Ofrenda
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Ofrendas</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalOfrendas}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Monto Total</p>
              <p className="text-3xl font-bold mt-1">
                ${montoTotal.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-emerald-400/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Ofrendas */}
      {!ofrendas || ofrendas.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <TrendingUp className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            No hay ofrendas registradas
          </h3>
          <p className="text-slate-600 mb-6">
            Registra la primera ofrenda para comenzar a rastrear los ingresos
          </p>
          {canManage && (
            <Link
              href={`/dashboard/comites/${params.id}/ofrendas/nueva`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" />
              Registrar Primera Ofrenda
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Método Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Comprobante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Concepto
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {ofrendas.map((ofrenda) => (
                  <tr key={ofrenda.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-900">
                          {new Date(ofrenda.fecha).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                        {ofrenda.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold text-emerald-600">
                          ${ofrenda.monto.toLocaleString('es-CO')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600 capitalize">
                        {ofrenda.nota || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      -
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="max-w-xs truncate">
                        {ofrenda.concepto || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
