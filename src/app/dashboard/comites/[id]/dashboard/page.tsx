import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function DashboardComitePage({ params }: PageProps) {
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

  // Obtener balance usando la función SQL
  const { data: balanceData } = await supabase.rpc('obtener_balance_comite', {
    p_comite_id: params.id,
  })

  const balance = (Array.isArray(balanceData) ? balanceData[0] : balanceData) as { balance: number; total_ingresos: number; total_egresos: number } || { balance: 0, total_ingresos: 0, total_egresos: 0 }

  // Obtener estadísticas (conteos)
  const [
    { count: totalProyectos },
    { count: totalVotos },
    { count: totalMiembros }
  ] = await Promise.all([
    supabase.from('comite_proyectos').select('*', { count: 'exact', head: true }).eq('comite_id', params.id),
    supabase.from('comite_votos').select('*', { count: 'exact', head: true }).eq('comite_id', params.id).eq('estado', 'activo'),
    supabase.from('comite_miembros').select('*', { count: 'exact', head: true }).eq('comite_id', params.id).eq('estado', 'activo')
  ])

  // TODO: Obtener transacciones recientes (mock por ahora)
  const transaccionesRecientes: any[] = []

  // TODO: Obtener votos activos (mock por ahora)
  const votosActivos: any[] = []

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

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
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              Dashboard: {comite.nombre}
            </h1>
            <p className="text-slate-600 mt-2">
              Vista general de la contabilidad del comité
            </p>
          </div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="mb-8">
        <BalanceCard data={balance} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link
          href={`/dashboard/comites/${params.id}/proyectos`}
          className="bg-white rounded-xl border border-slate-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Proyectos Activos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalProyectos || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Link>

        <Link
          href={`/dashboard/comites/${params.id}/votos`}
          className="bg-white rounded-xl border border-slate-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Votos Activos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalVotos || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
              <FileText className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </Link>

        <Link
          href={`/dashboard/comites/${params.id}/miembros`}
          className="bg-white rounded-xl border border-slate-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Miembros Activos</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalMiembros || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-cyan-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </Link>
      </div>

      {/* Acciones Rápidas */}
      {canManage && (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary-600" />
            Acciones Rápidas
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link
              href={`/dashboard/comites/${params.id}/ofrendas/nueva`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-slate-900">Registrar Ofrenda</span>
            </Link>

            <Link
              href={`/dashboard/comites/${params.id}/gastos/nuevo`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-rose-600" />
              </div>
              <span className="text-sm font-medium text-slate-900">Registrar Gasto</span>
            </Link>

            <Link
              href={`/dashboard/comites/${params.id}/votos/nuevo`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-slate-900">Nuevo Voto</span>
            </Link>

            <Link
              href={`/dashboard/comites/${params.id}/proyectos/nuevo`}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-slate-900">Nuevo Proyecto</span>
            </Link>
          </div>
        </div>
      )}

      {/* Grid de Información */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Votos Activos */}
        <VotosActivosComite votos={votosActivos} comiteId={params.id} />

        {/* Transacciones Recientes */}
        <TransaccionesRecientes transacciones={transaccionesRecientes} />
      </div>
    </div>
  )
}
