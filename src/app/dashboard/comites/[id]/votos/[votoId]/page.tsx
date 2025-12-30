import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Vote,
  User,
  Calendar,
  DollarSign,
  Target,
  Activity,
  Edit,
  AlertCircle,
} from 'lucide-react'
import { HistorialPagosClient } from '@/components/comites/HistorialPagosClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
    votoId: string
  }
}

export default async function DetalleVotoPage({ params }: PageProps) {
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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

  // Obtener voto con datos del proyecto
  const { data: voto, error: votoError } = await supabase
    .from('comite_votos')
    .select(`
      *,
      comites(nombre),
      comite_miembros(nombres, apellidos),
      comite_proyectos(nombre)
    `)
    .eq('id', params.votoId)
    .eq('comite_id', params.id)
    .single()

  if (votoError || !voto) {
    console.error('Error al cargar voto:', votoError)
    return notFound()
  }

  // Obtener pagos del voto
  const { data: pagos, error: pagosError } = await supabase
    .from('comite_pagos')
    .select('*')
    .eq('voto_id', params.votoId)
    .order('fecha_pago', { ascending: false })

  if (pagosError) {
    console.error('Error al cargar pagos:', pagosError)
  }

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  // Calcular información
  const porcentajePagado = voto.monto_total > 0 ? (voto.recaudado / voto.monto_total) * 100 : 0
  const montoRestante = voto.monto_total - voto.recaudado
  const isVencido = new Date(voto.fecha_limite) < new Date()
  const estadoReal = voto.estado === 'activo' && isVencido ? 'vencido' : voto.estado

  // Calcular días para vencer
  const diasParaVencer = Math.ceil(
    (new Date(voto.fecha_limite).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )
  const vencimientoCerca = diasParaVencer <= 7 && diasParaVencer > 0

  const miembro = voto.comite_miembros as any
  const comite = voto.comites as any
  const proyecto = voto.comite_proyectos as any

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${params.id}/votos`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Votos
        </Link>

        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
              <Vote className="w-8 h-8 text-white" />
            </div>
            <div>
              <span
                className={`
                  inline-block px-3 py-1 rounded-full text-xs font-medium mb-2
                  ${estadoReal === 'activo'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : estadoReal === 'vencido'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : estadoReal === 'completado'
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }
                `}
              >
                {estadoReal === 'vencido' ? 'Vencido' : 
                 estadoReal === 'completado' ? 'Completado' :
                 estadoReal === 'cancelado' ? 'Cancelado' : 'Activo'}
              </span>
              <h1 className="text-3xl font-bold text-slate-900">
                Voto - {miembro?.nombres} {miembro?.apellidos}
              </h1>
              <p className="text-slate-600 mt-1">{comite?.nombre}</p>
            </div>
          </div>

          {canManage && estadoReal !== 'completado' && (
            <Link
              href={`/dashboard/comites/${params.id}/votos/${params.votoId}/editar`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <Edit className="w-5 h-5" />
              Editar Voto
            </Link>
          )}
        </div>
      </div>

      {/* Alertas */}
      {isVencido && estadoReal === 'vencido' && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-rose-900">Voto Vencido</p>
            <p className="text-sm text-rose-700 mt-1">
              Este voto venció el {new Date(voto.fecha_limite).toLocaleDateString('es-CO')}
            </p>
          </div>
        </div>
      )}

      {vencimientoCerca && estadoReal === 'activo' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-900">Vencimiento Próximo</p>
            <p className="text-sm text-amber-700 mt-1">
              Este voto vence en {diasParaVencer} día{diasParaVencer !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Monto Total */}
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-cyan-100 text-sm font-medium">Monto Total</p>
            <DollarSign className="w-5 h-5 text-cyan-200" />
          </div>
          <p className="text-3xl font-bold">
            ${voto.monto_total.toLocaleString('es-CO')}
          </p>
        </div>

        {/* Pagado */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Pagado</p>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            ${voto.recaudado.toLocaleString('es-CO')}
          </p>
          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
            />
          </div>
        </div>

        {/* Restante */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Restante</p>
            <DollarSign className="w-5 h-5 text-rose-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ${montoRestante.toLocaleString('es-CO')}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            {porcentajePagado.toFixed(0)}% completado
          </p>
        </div>

        {/* Pagos Realizados */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-600 text-sm font-medium">Pagos</p>
            <Activity className="w-5 h-5 text-primary-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {pagos?.length || 0}
          </p>
          <p className="text-sm text-slate-500 mt-1">transacciones</p>
        </div>
      </div>

      {/* Información del Voto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Usuario */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-600" />
            Información del Usuario
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Nombre</p>
              <p className="text-sm font-medium text-slate-900">
                {miembro?.nombres} {miembro?.apellidos}
              </p>
            </div>
            {miembro?.telefono && (
              <div>
                <p className="text-xs text-slate-500">Teléfono</p>
                <p className="text-sm font-medium text-slate-900">{miembro.telefono}</p>
              </div>
            )}
            {miembro?.email && (
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-900">{miembro.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Detalles del Voto */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-600" />
            Detalles del Voto
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-500">Fecha de Vencimiento</p>
              <p className={`text-sm font-medium ${isVencido ? 'text-rose-600' : 'text-slate-900'}`}>
                {new Date(voto.fecha_limite).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            {proyecto && (
              <div>
                <p className="text-xs text-slate-500">Proyecto Asociado</p>
                <Link
                  href={`/dashboard/comites/${params.id}/proyectos/${voto.proyecto_id}`}
                  className="text-sm font-medium text-purple-600 hover:text-purple-700 inline-flex items-center gap-1 transition-colors"
                >
                  <Target className="w-4 h-4" />
                  {proyecto.nombre}
                </Link>
              </div>
            )}
            {voto.concepto && (
              <div>
                <p className="text-xs text-slate-500">Concepto</p>
                <p className="text-sm text-slate-700">{voto.concepto}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500">Fecha de Creación</p>
              <p className="text-sm text-slate-900">
                {new Date(voto.created_at).toLocaleDateString('es-CO', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Pagos */}
      <HistorialPagosClient
        votoId={params.votoId}
        comiteId={params.id}
        pagos={pagos || []}
        montoTotal={voto.monto_total}
        montoPagado={voto.recaudado}
        canManage={canManage}
      />
    </div>
  )
}
