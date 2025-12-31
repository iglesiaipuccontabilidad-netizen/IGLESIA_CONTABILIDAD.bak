import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingDown, Plus, DollarSign } from 'lucide-react'
import { GastosList } from '@/components/comites/GastosList'
import { ExportButton } from '@/components/comites/ExportButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function GastosComitePage({ params }: PageProps) {
  const { id } = await params
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
      .eq('comite_id', id)
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
    .eq('id', id)
    .single()

  if (comiteError || !comite) {
    console.error('Error al cargar comité:', comiteError)
    return notFound()
  }

  // Obtener gastos del comité
  const { data: gastos, error: gastosError } = await supabase
    .from('comite_gastos')
    .select('*')
    .eq('comite_id', id)
    .order('fecha', { ascending: false })

  if (gastosError) {
    console.error('Error al cargar gastos:', gastosError)
  }

  // Calcular estadísticas
  const totalGastos = gastos?.length || 0
  const montoTotal = gastos?.reduce((sum, g) => sum + g.monto, 0) || 0

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${id}/dashboard`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
              Gastos: {comite.nombre}
            </h1>
            <p className="text-slate-600 mt-2">
              Gestiona los egresos y gastos del comité
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExportButton
              comiteId={id}
              comiteNombre={comite.nombre}
              tipo="gastos"
              datos={gastos || []}
            />
            {canManage && (
              <Link
                href={`/dashboard/comites/${id}/gastos/nuevo`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Nuevo Gasto
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Gastos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalGastos}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-rose-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-rose-100 text-sm">Monto Total</p>
              <p className="text-3xl font-bold mt-1">
                ${montoTotal.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-rose-400/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Gastos con filtros */}
      <GastosList gastos={gastos || []} comiteId={id} />
    </div>
  )
}
