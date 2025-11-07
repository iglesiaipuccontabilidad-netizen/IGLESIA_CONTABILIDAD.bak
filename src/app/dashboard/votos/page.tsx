'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getVotosWithDetails } from '@/app/actions/votos-actions'
import type { VotoDetalle } from '@/types/votos'

interface FiltrosVotos {
  busqueda: string
  proposito: string
  estado: string
  fecha_inicio?: string
  fecha_fin?: string
}

// Constantes
const ESTADOS_VOTO = {
  ACTIVO: 'activo',
  COMPLETADO: 'completado',
  VENCIDO: 'vencido'
} as const

const PROPOSITOS_VOTO = {
  TEMPLO: 'Templo',
  MISIONES: 'Misiones',
  EVANGELIZACION: 'Evangelización'
} as const

export default function VotosPage() {
  const [votos, setVotos] = useState<VotoDetalle[]>([])
  const [filtros, setFiltros] = useState<FiltrosVotos>({
    busqueda: '',
    proposito: '',
    estado: ''
  })
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary-50 via-slate-50 to-cyan-50 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-16 right-20 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl"></div>
        <div className="absolute bottom-24 left-16 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl"></div>
      </div>

      <div className="container-custom relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-200 bg-primary-50/90 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 shadow-sm">
              Panel de Votos
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary-600 via-primary-500 to-cyan-500 bg-clip-text text-transparent">
              Gestión de Votos
            </h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Analiza el avance de los compromisos financieros de la congregación, controla su estado y registra nuevos pagos o votos desde un panel moderno y organizado.
            </p>
          </div>

          <Link
            href="/dashboard/votos/nuevo"
            className="btn btn-lg bg-gradient-to-r from-primary-500 via-primary-600 to-cyan-500 text-white shadow-lg shadow-primary-500/20 transition hover:shadow-primary-500/40"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
              <span>Nuevo voto</span>
            </div>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Total comprometido',
              value: formatearMonto(estadisticas.totalComprometido),
              helper: 'Valor total de los votos registrados',
              gradient: 'from-primary-500 to-primary-700'
            },
            {
              title: 'Total recaudado',
              value: formatearMonto(estadisticas.totalRecaudado),
              helper: `${estadisticas.porcentajeGlobal.toFixed(1)}% del total`,
              gradient: 'from-primary-500 to-cyan-500'
            },
            {
              title: 'Monto pendiente',
              value: formatearMonto(estadisticas.totalPendiente),
              helper: 'Por recaudar en votos activos',
              gradient: 'from-amber-400 to-orange-500'
            },
            {
              title: 'Votos activos',
              value: estadisticas.votosActivos,
              helper: `de ${votos.length} votos totales`,
              gradient: 'from-emerald-500 to-cyan-500'
            }
          ].map((card, index) => (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/90 p-6 shadow-soft backdrop-blur transition hover:-translate-y-1 hover:shadow-medium"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-10 transition group-hover:opacity-20`} />
              <div className="relative flex flex-col space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.title}</span>
                <span className="text-3xl font-bold text-slate-900">{card.value}</span>
                <span className="text-sm text-slate-500">{card.helper}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <button
                  key={filter.value || 'all'}
                  type="button"
                  onClick={() => setFiltros(prev => ({ ...prev, estado: filter.value }))}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filtros.estado === filter.value
                      ? 'bg-primary-100 text-primary-700 border border-primary-200 shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 border border-transparent'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nombre o propósito..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="input w-full lg:w-72 pl-10"
                />
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 5.64 5.64a7.5 7.5 0 0 0 10.61 10.61Z" />
                </svg>
              </div>

              <input
                type="date"
                value={filtros.fecha_inicio ?? ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                className="input w-full lg:w-40"
              />
              <input
                type="date"
                value={filtros.fecha_fin ?? ''}
                onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
                className="input w-full lg:w-40"
              />
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left">Miembro</th>
                  <th scope="col" className="px-6 py-4 text-left">Propósito</th>
                  <th scope="col" className="px-6 py-4 text-right">Monto total</th>
                  <th scope="col" className="px-6 py-4 text-left">Progreso</th>
                  <th scope="col" className="px-6 py-4 text-center">Estado</th>
                  <th scope="col" className="px-6 py-4 text-center">Fecha límite</th>
                  <th scope="col" className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {votosFiltrados.length > 0 ? (
                  votosFiltrados.map((voto) => {
                    const progreso = calcularProgreso(voto)
                    const avatar = voto.miembro ? `${voto.miembro.nombres.charAt(0)}${voto.miembro.apellidos.charAt(0)}` : 'NA'

                    return (
                      <tr key={voto.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-sm font-semibold text-white shadow-md">
                              {avatar}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900">
                                {voto.miembro
                                  ? `${voto.miembro.nombres} ${voto.miembro.apellidos}`
                                  : 'Sin asignar'}
                              </span>
                              <span className="text-xs text-slate-500">Creado el {new Date(voto.created_at).toLocaleDateString('es-CO')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-medium text-slate-900">{voto.proposito}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-slate-900">
                          {formatearMonto(Number(voto.monto_total))}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2.5 w-full rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-500 transition-all"
                                style={{ width: `${progreso}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-xs font-semibold text-slate-600">
                              {progreso.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            voto.estado === ESTADOS_VOTO.ACTIVO
                              ? 'bg-emerald-100 text-emerald-700'
                              : voto.estado === ESTADOS_VOTO.COMPLETADO
                                ? 'bg-primary-100 text-primary-700'
                                : 'bg-rose-100 text-rose-700'
                          }`}>
                            <span className={`mr-2 block h-1.5 w-1.5 rounded-full ${
                              voto.estado === ESTADOS_VOTO.ACTIVO
                                ? 'bg-emerald-500'
                                : voto.estado === ESTADOS_VOTO.COMPLETADO
                                  ? 'bg-primary-500'
                                  : 'bg-rose-500'
                            }`} />
                            {voto.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-slate-600">
                          {new Date(voto.fecha_limite).toLocaleDateString('es-CO')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/votos/${voto.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600 transition hover:bg-primary-100"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                              </svg>
                              Ver
                            </Link>
                            <Link
                              href={`/dashboard/pagos/nuevo?voto=${voto.id}`}
                              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.171-.879-1.172-2.303 0-3.182C10.536 7.719 11.768 7.5 12 7.5c1.45 0 2.9.549 4.003 1.657" />
                              </svg>
                              Pago
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm text-slate-500">
                      No se encontraron votos que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}