'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getVotosWithDetails, deleteVoto } from '@/app/actions/votos-actions'
import type { VotoDetalle } from '@/types/votos'

interface FiltrosVotos {
  busqueda: string
  proposito: string
  estado: string
  fecha_inicio?: string
  fecha_fin?: string
}

const ESTADOS_VOTO = {
  ACTIVO: 'activo',
  COMPLETADO: 'completado',
  VENCIDO: 'vencido'
} as const

export default function VotosPage() {
  const [votos, setVotos] = useState<VotoDetalle[]>([])
  const [filtros, setFiltros] = useState<FiltrosVotos>({
    busqueda: '',
    proposito: '',
    estado: ''
  })
  const [loading, setLoading] = useState(true)
  const [actualizando, setActualizando] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null)

  const actualizarEstados = async () => {
    try {
      setActualizando(true)
      const { actualizarTodosLosEstados } = await import('@/app/actions/actualizar-todos-estados')
      const resultado = await actualizarTodosLosEstados()
      
      if (!resultado.success) {
        console.error('Error al actualizar estados:', resultado.error)
        return
      }

      await cargarVotos()
    } catch (error) {
      console.error('Error al actualizar estados:', error)
    } finally {
      setActualizando(false)
    }
  }

  const cargarVotos = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await getVotosWithDetails()

      if (error) {
        console.error('Error al cargar los votos:', error)
        return
      }

      setVotos(data ?? [])
    } catch (error) {
      console.error('Error al cargar votos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleEliminarVoto = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este voto? Esta acción no se puede deshacer y eliminará también todos los pagos asociados.')) {
      return
    }

    try {
      setEliminando(id)
      const resultado = await deleteVoto(id)

      if (!resultado.success) {
        alert('Error al eliminar el voto. Por favor, intenta de nuevo.')
        console.error('Error:', resultado.error)
        return
      }

      await cargarVotos()
    } catch (error) {
      console.error('Error al eliminar voto:', error)
      alert('Error al eliminar el voto. Por favor, intenta de nuevo.')
    } finally {
      setEliminando(null)
    }
  }

  useEffect(() => {
    cargarVotos()
  }, [cargarVotos])

  const formatearMonto = useCallback((monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto)
  }, [])

  const calcularProgreso = useCallback((voto: VotoDetalle) => {
    const total = Number(voto.monto_total) || 1
    const recaudado = voto.total_pagado ?? 0
    return Math.min(Math.max((recaudado / total) * 100, 0), 100)
  }, [])

  const estadisticas = useMemo(() => {
    if (!votos.length) {
      return {
        totalComprometido: 0,
        totalRecaudado: 0,
        totalPendiente: 0,
        votosActivos: 0,
        porcentajeGlobal: 0
      }
    }

    const totales = votos.reduce(
      (acc, voto) => {
        const montoTotal = Number(voto.monto_total) || 0
        const recaudado = voto.total_pagado ?? 0

        acc.totalComprometido += montoTotal
        acc.totalRecaudado += recaudado
        acc.votosActivos += voto.estado === ESTADOS_VOTO.ACTIVO ? 1 : 0

        return acc
      },
      { totalComprometido: 0, totalRecaudado: 0, votosActivos: 0 }
    )

    const totalPendiente = Math.max(totales.totalComprometido - totales.totalRecaudado, 0)
    const porcentajeGlobal = totales.totalComprometido === 0
      ? 0
      : (totales.totalRecaudado / totales.totalComprometido) * 100

    return {
      totalComprometido: totales.totalComprometido,
      totalRecaudado: totales.totalRecaudado,
      totalPendiente,
      votosActivos: totales.votosActivos,
      porcentajeGlobal
    }
  }, [votos])

  const aplicarFiltros = useCallback((voto: VotoDetalle) => {
    const { busqueda, proposito, estado, fecha_inicio, fecha_fin } = filtros
    const nombreCompleto = voto.miembro ?
      `${voto.miembro.nombres} ${voto.miembro.apellidos}`.toLowerCase() : ''

    const cumpleBusqueda = !busqueda ||
      nombreCompleto.includes(busqueda.toLowerCase()) ||
      voto.proposito.toLowerCase().includes(busqueda.toLowerCase())

    const cumpleProposito = !proposito ||
      voto.proposito.toLowerCase() === proposito.toLowerCase()

    const cumpleEstado = !estado || voto.estado === estado

    const fechaCreacion = new Date(voto.created_at)
    const cumpleFechaInicio = !fecha_inicio || fechaCreacion >= new Date(fecha_inicio)
    const cumpleFechaFin = !fecha_fin || fechaCreacion <= new Date(fecha_fin)

    return cumpleBusqueda && cumpleProposito && cumpleEstado && cumpleFechaInicio && cumpleFechaFin
  }, [filtros])

  const votosFiltrados = useMemo(() => votos.filter(aplicarFiltros), [votos, aplicarFiltros])

  const quickFilters = [
    { label: 'Todos', value: '' },
    { label: 'Activos', value: ESTADOS_VOTO.ACTIVO },
    { label: 'Completados', value: ESTADOS_VOTO.COMPLETADO },
    { label: 'Vencidos', value: ESTADOS_VOTO.VENCIDO }
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 text-slate-600">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
        <p className="text-sm font-medium">Cargando votos...</p>
      </div>
    )
  }

  const VotoCard = ({ voto }: { voto: VotoDetalle }) => {
    const progreso = calcularProgreso(voto)
    const avatar = voto.miembro ? `${voto.miembro.nombres.charAt(0)}${voto.miembro.apellidos.charAt(0)}` : 'NA'

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white shadow-md flex-shrink-0">
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 text-sm truncate">
              {voto.miembro ? `${voto.miembro.nombres} ${voto.miembro.apellidos}` : 'Sin asignar'}
            </h3>
            <p className="text-xs text-slate-600 truncate">{voto.proposito}</p>
          </div>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0 ${
            voto.estado === ESTADOS_VOTO.ACTIVO
              ? 'bg-emerald-100 text-emerald-700'
              : voto.estado === ESTADOS_VOTO.COMPLETADO
                ? 'bg-primary-100 text-primary-700'
                : 'bg-rose-100 text-rose-700'
          }`}>
            {voto.estado}
          </span>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Monto:</span>
            <span className="font-semibold text-slate-900">{formatearMonto(Number(voto.monto_total))}</span>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-600">Progreso:</span>
              <span className="font-semibold text-slate-900">{progreso.toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-600">Fecha límite:</span>
            <span className="text-slate-900">{new Date(voto.fecha_limite).toLocaleDateString('es-CO')}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href={`/dashboard/votos/${voto.id}`}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-600 transition hover:bg-primary-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
            </svg>
            Ver
          </Link>
          <Link
            href={`/dashboard/pagos/nuevo?voto=${voto.id}`}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.171-.879-1.172-2.303 0-3.182C10.536 7.719 11.768 7.5 12 7.5c1.45 0 2.9.549 4.003 1.657" />
            </svg>
            Pago
          </Link>
          <Link
            href={`/dashboard/votos/editar/${voto.id}`}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-600 transition hover:bg-amber-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
            </svg>
            Editar
          </Link>
          <button
            onClick={() => handleEliminarVoto(voto.id)}
            disabled={eliminando === voto.id}
            className="inline-flex items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
          >
            {eliminando === voto.id ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
                Eliminar
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-50 via-slate-50 to-cyan-50 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 right-20 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl"></div>
        <div className="absolute bottom-24 left-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-start">
          <div className="space-y-2 md:space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-200 bg-primary-50/90 px-3 md:px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 shadow-sm">
              Panel de Votos
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 bg-clip-text text-transparent">
              Gestión de Votos
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Analiza el avance de los compromisos financieros de la congregación
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dashboard/votos/nuevo"
              className="btn btn-lg bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 text-white shadow-lg shadow-primary-500/20 transition hover:shadow-primary-500/40 text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
                </svg>
                <span>Nuevo voto</span>
              </div>
            </Link>
            
            <button
              onClick={actualizarEstados}
              disabled={actualizando}
              className="btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {actualizando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualizando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Actualizar estados</span>
                  <span className="sm:hidden">Actualizar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            {
              title: 'Comprometido',
              value: formatearMonto(estadisticas.totalComprometido),
              helper: 'Total de votos',
              bgColor: 'bg-primary-50',
              iconColor: 'text-primary-600',
            },
            {
              title: 'Recaudado',
              value: formatearMonto(estadisticas.totalRecaudado),
              helper: `${estadisticas.porcentajeGlobal.toFixed(1)}%`,
              bgColor: 'bg-white',
              iconColor: 'text-cyan-600',
            },
            {
              title: 'Pendiente',
              value: formatearMonto(estadisticas.totalPendiente),
              helper: 'Por recaudar',
              bgColor: 'bg-rose-50',
              iconColor: 'text-rose-600',
            },
            {
              title: 'Activos',
              value: estadisticas.votosActivos,
              helper: `de ${votos.length} totales`,
              bgColor: 'bg-emerald-50',
              iconColor: 'text-emerald-600',
            }
          ].map((card) => (
            <div
              key={card.title}
              className={`${card.bgColor} rounded-lg p-3 md:p-4 shadow transition-all duration-300 hover:shadow-md`}
            >
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide block mb-1">
                {card.title}
              </span>
              <span className="text-lg md:text-2xl font-bold text-slate-900 block">{card.value}</span>
              <span className="text-xs text-slate-500">{card.helper}</span>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-soft">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <button
                  key={filter.value || 'all'}
                  type="button"
                  onClick={() => setFiltros(prev => ({ ...prev, estado: filter.value }))}
                  className={`rounded-full px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition ${
                    filtros.estado === filter.value
                      ? 'bg-primary-100 text-primary-700 border border-primary-200 shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Buscar por nombre o propósito..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="input w-full pl-10 text-sm"
                />
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 5.64 5.64a7.5 7.5 0 0 0 10.61 10.61Z" />
                </svg>
              </div>

              <div className="flex gap-3">
                <input
                  type="date"
                  value={filtros.fecha_inicio ?? ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                  className="input flex-1 md:w-40 text-sm"
                />
                <input
                  type="date"
                  value={filtros.fecha_fin ?? ''}
                  onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
                  className="input flex-1 md:w-40 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vista de tarjetas para móvil */}
        <div className="space-y-3 md:space-y-4">
          {votosFiltrados.length > 0 ? (
            votosFiltrados.map((voto) => <VotoCard key={voto.id} voto={voto} />)
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-8 md:p-16 text-center text-sm text-slate-500">
              No se encontraron votos que coincidan con los filtros aplicados.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
