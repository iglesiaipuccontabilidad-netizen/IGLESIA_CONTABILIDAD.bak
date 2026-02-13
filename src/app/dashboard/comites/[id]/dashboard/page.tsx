import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from '@/components/OrgLink'
import {
  ArrowLeft,
  LayoutDashboard,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  FileText,
  PlusCircle
} from 'lucide-react'
import { BalanceCard } from '@/components/comites/BalanceCard'
import { TransaccionesRecientes } from '@/components/comites/TransaccionesRecientes'
import { VotosActivosComite } from '@/components/comites/VotosActivosComite'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'
import LogoutButton from '@/components/LogoutButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function DashboardComitePage({ params }: PageProps) {
  const supabase = await createClient()

  // Await params en Next.js 15+
  const { id } = await params

  // Verificar acceso al comité (incluye validación de autenticación)
  const access = await requireComiteAccess(id)

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

  // Obtener balance usando la función SQL
  const { data: balanceData } = await supabase.rpc('obtener_balance_comite', {
    p_comite_id: id,
  })

  const balance = (Array.isArray(balanceData) ? balanceData[0] : balanceData) as { balance: number; total_ingresos: number; total_egresos: number } || { balance: 0, total_ingresos: 0, total_egresos: 0 }

  // Obtener estadísticas (conteos)
  const [
    { count: totalProyectos },
    { count: totalVotos },
    { count: totalMiembros }
  ] = await Promise.all([
    supabase.from('comite_proyectos').select('*', { count: 'exact', head: true }).eq('comite_id', id),
    supabase.from('comite_votos').select('*', { count: 'exact', head: true }).eq('comite_id', id).eq('estado', 'activo'),
    supabase.from('comite_miembros').select('*', { count: 'exact', head: true }).eq('comite_id', id).eq('estado', 'activo')
  ])

  // TODO: Obtener transacciones recientes (mock por ahora)
  const transaccionesRecientes: any[] = []

  // TODO: Obtener votos activos (mock por ahora)
  const votosActivos: any[] = []

  const canManage = access.isAdmin || access.rolEnComite === 'lider' || access.rolEnComite === 'tesorero'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header (minimalista y profesional) */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex-shrink-0 w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-slate-700" />
                </div>

                <div className="min-w-0">
                  <h1 className="text-lg font-semibold text-slate-900 truncate">Dashboard</h1>
                  <p className="text-sm text-slate-500 truncate">{comite.nombre}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm text-slate-700 font-medium">Administrador</span>
                </div>
                <LogoutButton collapsed />
              </div>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="mb-6 sm:mb-8">
          <BalanceCard data={balance} />
        </div>

        {/* Stats Row - Mejorado para móviles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href={`/dashboard/comites/${id}/proyectos`}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 sm:p-6 hover:shadow-xl hover:border-purple-200 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Proyectos Activos</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalProyectos || 0}</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Target className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
              </div>
            </div>
            <div className="relative mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </Link>

          <Link
            href={`/dashboard/comites/${id}/votos`}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 sm:p-6 hover:shadow-xl hover:border-amber-200 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Votos Activos</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalVotos || 0}</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-amber-600" />
              </div>
            </div>
            <div className="relative mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </Link>

          <Link
            href={`/dashboard/comites/${id}/miembros`}
            className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-5 sm:p-6 hover:shadow-xl hover:border-cyan-200 transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600 mb-1 sm:mb-2">Miembros Activos</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalMiembros || 0}</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-200 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Users className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-600" />
              </div>
            </div>
            <div className="relative mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </Link>
        </div>

        {/* Acciones Rápidas - Mejorado para móviles */}
        {canManage && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border border-slate-300 p-6 sm:p-8 lg:p-10 mb-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-blue-400 flex items-center justify-center shadow-md">
                  <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <span>Acciones Rápidas</span>
              </h2>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <Link
                href={`/dashboard/comites/${id}/ofrendas/nueva`}
                className="group relative flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-300 hover:shadow-xl transition-transform duration-300 hover:scale-105"
              >
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-green-300 to-green-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-800 text-center">Registrar Ofrenda</span>
              </Link>

              <Link
                href={`/dashboard/comites/${id}/gastos/nuevo`}
                className="group relative flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-300 hover:shadow-xl transition-transform duration-300 hover:scale-105"
              >
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-red-300 to-red-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-800 text-center">Registrar Gasto</span>
              </Link>

              <Link
                href={`/dashboard/comites/${id}/votos/nuevo`}
                className="group relative flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border border-yellow-300 hover:shadow-xl transition-transform duration-300 hover:scale-105"
              >
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-800 text-center">Nuevo Voto</span>
              </Link>

              <Link
                href={`/dashboard/comites/${id}/proyectos/nuevo`}
                className="group relative flex flex-col items-center gap-3 p-5 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-300 hover:shadow-xl transition-transform duration-300 hover:scale-105"
              >
                <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-purple-300 to-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <span className="text-sm font-bold text-slate-800 text-center">Nuevo Proyecto</span>
              </Link>
            </div>
          </div>
        )}

        {/* Grid de Información - Mejorado para móviles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Votos Activos */}
          <VotosActivosComite votos={votosActivos} comiteId={id} />

          {/* Transacciones Recientes */}
          <TransaccionesRecientes transacciones={transaccionesRecientes} />
        </div>
      </div>
    </div>
  )
}
