import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { formatCurrency, formatDate, getProgressStatus } from '@/utils/format'
import styles from '@/styles/components/VotoDetalle.module.css'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, DollarSign, Calendar, TrendingUp, Clock, CheckCircle, AlertCircle, CreditCard } from 'lucide-react'

type TablaVotos = Database['public']['Tables']['votos']['Row']
type TablaMiembros = Database['public']['Tables']['miembros']['Row']
type TablaPagos = Database['public']['Tables']['pagos']['Row']

interface VotoConDetalles extends TablaVotos {
  miembro: Pick<TablaMiembros, 'id' | 'nombres' | 'apellidos'>
  pagos: Array<{
    id: string
    monto: number
    fecha_pago: string
    metodo_pago?: string
    nota?: string | null
    created_at?: string
    registrado_por?: string
    voto_id?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function VotoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  // Validar el ID antes de usarlo
  const { id } = await params
  
  if (!id) {
    return notFound()
  }

  const supabase = await createClient()

  const { data: voto, error } = await supabase
    .from('votos')
    .select(`
      *,
      miembro:miembros!miembro_id (
        id,
        nombres,
        apellidos
      ),
      pagos (
        id,
        created_at,
        fecha_pago,
        monto,
        voto_id,
        nota,
        registrado_por,
        metodo_pago
      )
    `)
    .eq('id', id)
    .single() as { data: VotoConDetalles | null, error: any }

  if (error) {
    console.error('Error al cargar el voto:', error.message)
    return notFound()
  }

  if (!voto) {
    console.error('No se encontró el voto')
    return notFound()
  }

  const progreso = Math.round((voto.recaudado || 0) / voto.monto_total * 100)
  const montoPendiente = voto.monto_total - (voto.recaudado || 0)
  const progressStatus = getProgressStatus(progreso)
  const pagosOrdenados = [...(voto.pagos || [])].sort(
    (a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()
  )
  const ultimoPago = pagosOrdenados[0]
  const totalPagos = voto.pagos?.length ?? 0
  const promedioPago = totalPagos > 0 ? (voto.recaudado || 0) / totalPagos : 0
  const estadoLabel =
    voto.estado === 'cancelado'
      ? 'Cancelado'
      : montoPendiente <= 0
        ? 'Completado'
        : 'Activo'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
      {/* Breadcrumbs mejorado */}
      <nav className="mb-6">
        <Link 
          href="/dashboard/votos" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span>Volver a votos</span>
        </Link>
      </nav>

      {/* Header mejorado con gradiente */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Dashboard · Sistema de Votos</p>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Detalle del Voto</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
              estadoLabel === 'Completado' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : estadoLabel === 'Cancelado'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200'
            }`}>
              {estadoLabel === 'Completado' ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
              {estadoLabel}
            </span>
          </div>
        </div>
      </header>

      {/* Sección de resumen mejorada con gradiente y sombras */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Card principal de progreso */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Pendiente por pagar</p>
                <p className="text-4xl font-bold">{formatCurrency(montoPendiente)}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-semibold">{progreso}%</span>
              </div>
            </div>
            
            {/* Barra de progreso mejorada */}
            <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(progreso, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-blue-100 mt-2">
              <span>{formatCurrency(voto.recaudado || 0)} recaudado</span>
              <span>Meta: {formatCurrency(voto.monto_total)}</span>
            </div>
          </div>

          {/* Stats cards mejorados */}
          <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500 mb-1">Meta</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(voto.monto_total)}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mb-1">Recaudado</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(voto.recaudado || 0)}</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 mb-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500 mb-1">Restante</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(montoPendiente)}</p>
            </div>
          </div>
        </div>

        {/* CTA Card mejorado */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2">Realizar un pago</h3>
            <p className="text-purple-100 text-sm">
              Registra un nuevo aporte y mantén actualizado el avance de este voto.
            </p>
          </div>
          
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-purple-100">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Actualización en tiempo real</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-purple-100">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Notificación automática</span>
            </li>
            <li className="flex items-center gap-2 text-sm text-purple-100">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Trazabilidad completa</span>
            </li>
          </ul>
          
          <Link
            href={`/dashboard/pagos/nuevo?voto=${id}`}
            className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all ${
              montoPendiente === 0 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-yellow-400 hover:bg-yellow-300 text-gray-900 hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
            {...(montoPendiente === 0 ? { 'aria-disabled': true, onClick: (e: React.MouseEvent) => e.preventDefault() } : {})}
          >
            {montoPendiente === 0 ? 'Compromiso completado' : 'Registrar pago ahora'}
          </Link>
          
          <div className="mt-4 pt-4 border-t border-purple-400/30 flex items-center justify-center gap-2 text-sm text-purple-100">
            <Calendar className="h-4 w-4" />
            <span>Fecha límite: {formatDate(voto.fecha_limite)}</span>
          </div>
        </div>
      </section>

      {/* Sección de detalles mejorada */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{voto.proposito}</h2>
              <p className="text-sm text-gray-500">
                Seguimiento del compromiso asignado al miembro.
              </p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
              {voto.estado}
            </span>
          </div>

          {/* Info del miembro mejorada */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {voto.miembro.nombres[0]}
              {voto.miembro.apellidos[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {voto.miembro.nombres} {voto.miembro.apellidos}
              </h3>
            </div>
          </div>

          <div className={styles.highlights}>
            <div className={styles.highlightCard}>
              <span className={styles.highlightLabel}>Pagos registrados</span>
              <span className={styles.highlightValue}>{totalPagos}</span>
              <span className={styles.highlightSubValue}>
                {totalPagos === 1 ? '1 registro' : `${totalPagos} registros`}
              </span>
            </div>
            <div className={styles.highlightCard}>
              <span className={styles.highlightLabel}>Último pago</span>
              <span className={styles.highlightValue}>
                {ultimoPago ? formatDate(ultimoPago.fecha_pago) : 'Sin registros'}
              </span>
              {ultimoPago && (
                <span className={styles.highlightSubValue}>
                  {formatCurrency(ultimoPago.monto)} · {ultimoPago.metodo_pago || 'Método no especificado'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.metricsCard}>
          <h3 className={styles.metricsTitle}>Resumen financiero</h3>
          <div className={styles.metricsList}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Estado actual</span>
              <span className={styles.metricValue}>{estadoLabel}</span>
              <span className={styles.metricHint}>
                {montoPendiente <= 0
                  ? 'Este voto ya alcanzó su meta establecida.'
                  : 'Aún quedan aportes pendientes para cumplir la meta.'}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Promedio por pago</span>
              <span className={styles.metricValue}>
                {totalPagos > 0 ? formatCurrency(promedioPago) : '—'}
              </span>
              <span className={styles.metricHint}>
                {totalPagos > 0
                  ? `Basado en ${totalPagos} ${totalPagos === 1 ? 'aporte' : 'aportes'} registrados.`
                  : 'Registra el primer pago para calcular un promedio.'}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Última actualización</span>
              <span className={styles.metricValue}>
                {voto.updated_at ? formatDate(voto.updated_at) : formatDate(voto.created_at)}
              </span>
              <span className={styles.metricHint}>
                {voto.updated_at ? 'Fecha del último ajuste del voto.' : 'Aún no se registran modificaciones posteriores.'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Historial de pagos mejorado */}
      <section className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">Historial de pagos</h3>
              <p className="text-sm text-gray-500">
                Controla cada aporte realizado y mantén la trazabilidad del compromiso.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
              <CreditCard className="h-4 w-4" />
              {totalPagos} {totalPagos === 1 ? 'registro' : 'registros'}
            </span>
          </div>
        </div>

        {totalPagos > 0 ? (
          <>
            {/* Vista desktop */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Método</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nota</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pagosOrdenados.map((pago, index) => (
                    <tr key={pago.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{formatDate(pago.fecha_pago)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-green-600">{formatCurrency(pago.monto)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {pago.metodo_pago || 'No especificado'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{pago.nota || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-gray-900">Total recaudado</td>
                    <td colSpan={2} className="px-6 py-4 text-sm font-bold text-green-600">{formatCurrency(voto.recaudado || 0)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-sm font-semibold text-gray-900">Pendiente por recaudar</td>
                    <td colSpan={2} className="px-6 py-4 text-sm font-bold text-orange-600">{formatCurrency(montoPendiente)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Vista móvil */}
            <div className="md:hidden divide-y divide-gray-200">
              {pagosOrdenados.map((pago) => (
                <div key={pago.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{formatDate(pago.fecha_pago)}</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(pago.monto)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {pago.metodo_pago || 'No especificado'}
                    </span>
                    {pago.nota && <span className="text-xs text-gray-500">{pago.nota}</span>}
                  </div>
                </div>
              ))}
              <div className="p-4 bg-gray-50 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-900">Total recaudado</span>
                  <span className="font-bold text-green-600">{formatCurrency(voto.recaudado || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-900">Pendiente</span>
                  <span className="font-bold text-orange-600">{formatCurrency(montoPendiente)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <CreditCard className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-4">Aún no se han registrado pagos para este voto.</p>
            <Link
              href={`/dashboard/pagos/nuevo?voto=${id}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <DollarSign className="h-5 w-5" />
              Registrar primer pago
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
