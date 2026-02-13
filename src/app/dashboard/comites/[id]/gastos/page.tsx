import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from '@/components/OrgLink'
import { ArrowLeft, TrendingDown, Plus, DollarSign } from 'lucide-react'
import { GastosList } from '@/components/comites/GastosList'
import { ExportButton } from '@/components/comites/ExportButton'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function GastosComitePage({ params }: PageProps) {
  const { id } = await params

  // SEGURIDAD: Validar acceso al comité
  const access = await requireComiteAccess(id)
  const isAdmin = access.isAdmin
  const rolEnComite = access.rolEnComite

  const supabase = await createClient()

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb mejorado */}
        <div className="mb-6">
          <Link
            href={`/dashboard/comites/${id}/dashboard`}
            className="group inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-primary-300 group-hover:bg-primary-50 transition-all duration-200">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Volver al Dashboard</span>
          </Link>
        </div>

        {/* Header mejorado */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Título y descripción */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30">
                      <TrendingDown className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-1">
                      Gastos
                    </h1>
                    <p className="text-lg text-rose-600 font-semibold">
                      {comite.nombre}
                    </p>
                  </div>
                </div>
                <p className="text-slate-600 text-base ml-20">
                  Gestiona y visualiza los egresos y gastos del comité
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap items-center gap-3">
                <ExportButton
                  comiteId={id}
                  comiteNombre={comite.nombre}
                  tipo="gastos"
                  datos={gastos || []}
                />
                {canManage && (
                  <Link
                    href={`/dashboard/comites/${id}/gastos/nuevo`}
                    className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600 to-rose-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Plus className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Nuevo Gasto</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Total Gastos */}
          <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingDown className="w-6 h-6 text-rose-600" />
                </div>
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">Total Gastos Registrados</p>
              <p className="text-3xl font-bold text-slate-900">{totalGastos}</p>
              <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          {/* Monto Total - Destacado */}
          <div className="group relative bg-gradient-to-br from-rose-500 via-rose-600 to-rose-700 rounded-2xl p-6 text-white overflow-hidden hover:shadow-2xl hover:shadow-rose-500/40 transition-all duration-300 hover:-translate-y-1">
            {/* Efectos de fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-rose-800/30 rounded-full blur-2xl"></div>

            <div className="relative">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <DollarSign className="w-7 h-7 text-white" />
                    </div>
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                  </div>
                  <p className="text-rose-100 text-sm font-medium mb-2">Monto Total Gastado</p>
                  <p className="text-4xl font-bold tracking-tight">
                    ${montoTotal.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-rose-100 text-sm">
                <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white/40 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <span className="font-medium">100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Gastos con filtros */}
        <GastosList gastos={gastos || []} comiteId={id} />
      </div>
    </div>
  )
}
