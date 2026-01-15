'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { getVotosWithDetails } from '@/app/actions/votos-actions'
import { getCurrentUserRole } from '@/lib/auth'
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
  const [userRole, setUserRole] = useState<string | null>(null)

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
    cargarUserRole()
  }, [cargarVotos])

  const cargarUserRole = useCallback(async () => {
    try {
      const role = await getCurrentUserRole()
      setUserRole(role)
    } catch (error) {
      console.error('Error cargando rol del usuario:', error)
    }
  }, [])

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
      (voto.proposito?.toLowerCase().includes(busqueda.toLowerCase()) ?? false)

    const cumpleProposito = !proposito ||
      (voto.proposito?.toLowerCase() === proposito.toLowerCase())

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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-cyan-50/50 px-4 py-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-32 h-96 w-96 rounded-full bg-gradient-to-br from-blue-400/10 to-cyan-400/10 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 left-20 h-80 w-80 rounded-full bg-gradient-to-br from-primary-400/10 to-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container-custom relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-500 p-2.5 shadow-lg shadow-primary-500/25">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="h-full w-full">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
              </div>
              <div>
                <span className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary-100/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-700 border border-primary-200/50">
                  Panel de Control
                </span>
              </div>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">
              Gestión de <span className="bg-gradient-to-r from-primary-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">Votos</span>
            </h1>
            <p className="max-w-2xl text-base text-slate-600 leading-relaxed">
              Monitorea el avance de los compromisos financieros, controla estados en tiempo real y registra pagos desde un panel intuitivo y moderno.
            </p>
          </div>

          <Link
            href="/dashboard/votos/nuevo"
            className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 via-blue-600 to-cyan-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-primary-500/30 transition-all hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-20"></div>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Nuevo Voto</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Total comprometido',
              value: formatearMonto(estadisticas.totalComprometido),
              helper: 'Valor total de los votos registrados',
              gradient: 'from-primary-600 via-primary-500 to-blue-600',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
              )
            },
            {
              title: 'Total recaudado',
              value: formatearMonto(estadisticas.totalRecaudado),
              helper: `${estadisticas.porcentajeGlobal.toFixed(1)}% del total`,
              gradient: 'from-emerald-600 via-emerald-500 to-teal-600',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                </svg>
              )
            },
            {
              title: 'Monto pendiente',
              value: formatearMonto(estadisticas.totalPendiente),
              helper: 'Por recaudar en votos activos',
              gradient: 'from-amber-500 via-orange-500 to-red-500',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              )
            },
            {
              title: 'Votos activos',
              value: estadisticas.votosActivos,
              helper: `de ${votos.length} votos totales`,
              gradient: 'from-cyan-600 via-blue-500 to-indigo-600',
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                </svg>
              )
            }
          ].map((card, index) => (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-white"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />
              <div className="relative flex flex-col space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{card.title}</span>
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.gradient} p-2 text-white shadow-lg opacity-80 group-hover:opacity-100 transition-opacity`}>
                    {card.icon}
                  </div>
                </div>
                <span className="text-4xl font-black text-slate-900">{card.value}</span>
                <div className="flex items-center gap-2">
                  <div className={`h-1 w-12 rounded-full bg-gradient-to-r ${card.gradient}`}></div>
                  <span className="text-xs font-medium text-slate-500">{card.helper}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filtros */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm p-6 shadow-lg">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-700 mr-2">Filtrar por estado:</span>
              {quickFilters.map((filter) => (
                <button
                  key={filter.value || 'all'}
                  type="button"
                  onClick={() => setFiltros(prev => ({ ...prev, estado: filter.value }))}
                  className={`group relative rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    filtros.estado === filter.value
                      ? 'bg-gradient-to-r from-primary-600 to-blue-600 text-white shadow-lg shadow-primary-500/30 scale-105'
                      : 'bg-slate-100 text-slate-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-blue-50 hover:text-primary-700 hover:shadow-md border border-slate-200'
                  }`}
                >
                  {filtros.estado === filter.value && (
                    <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
                  )}
                  <span className="relative">{filter.label}</span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35m0 0A7.5 7.5 0 1 0 5.64 5.64a7.5 7.5 0 0 0 10.61 10.61Z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por nombre o propósito..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white pl-12 pr-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <input
                    type="date"
                    value={filtros.fecha_inicio ?? ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
                    className="rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none"
                  />
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={filtros.fecha_fin ?? ''}
                    onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
                    className="rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                <tr>
                  <th scope="col" className="px-6 py-5 text-left">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">Miembro</span>
                  </th>
                  <th scope="col" className="px-6 py-5 text-left">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">Propósito</span>
                  </th>
                  <th scope="col" className="px-6 py-5 text-right">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">Monto total</span>
                  </th>
                  <th scope="col" className="px-6 py-5 text-right">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">Recaudado</span>
                  </th>
                  <th scope="col" className="px-6 py-5 text-left">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">Progreso</span>
                  </th>
                  <th scope="col" className="px-6 py-5 text-center">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">Estado</span>
                  </th>
                  <th scope="col" className="px-6 py-5 text-center">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">Fecha límite</span>
                  </th>
                  <th scope="col" className="px-6 py-5 text-right">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {votosFiltrados.length > 0 ? (
                  votosFiltrados.map((voto, index) => {
                    const progreso = calcularProgreso(voto)
                    const avatar = voto.miembro ? `${voto.miembro.nombres.charAt(0)}${voto.miembro.apellidos.charAt(0)}` : 'NA'

                    return (
                      <Link
                        key={voto.id}
                        href={`/dashboard/votos/${voto.id}`}
                        className="block"
                      >
                        <tr
                          className="group transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/30 cursor-pointer"
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-cyan-600 text-sm font-bold text-white shadow-lg group-hover:shadow-xl transition-shadow">
                                  {avatar}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500"></div>
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                  {voto.miembro
                                    ? `${voto.miembro.nombres} ${voto.miembro.apellidos}`
                                    : 'Sin asignar'}
                                </span>
                                <span className="text-xs font-medium text-slate-500">Creado el {new Date(voto.created_at).toLocaleDateString('es-CO')}</span>
                              </div>
                            </div>
                          </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary-500"></div>
                            <span className="font-bold text-slate-900">{voto.proposito}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="font-black text-slate-900">
                            {formatearMonto(Number(voto.monto_total))}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <span className="font-black text-emerald-600">
                            {formatearMonto(voto.total_pagado)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary-600 via-blue-500 to-cyan-500 shadow-sm transition-all duration-500 ease-out"
                                style={{ width: `${progreso}%` }}
                              />
                              <div 
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
                                style={{ width: `${progreso}%` }}
                              />
                            </div>
                            <span className="w-12 text-right text-xs font-black text-slate-700">
                              {progreso.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-black shadow-md ${
                            voto.estado === ESTADOS_VOTO.ACTIVO
                              ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200'
                              : voto.estado === ESTADOS_VOTO.COMPLETADO
                                ? 'bg-gradient-to-r from-primary-100 to-blue-50 text-primary-700 border border-primary-200'
                                : 'bg-gradient-to-r from-rose-100 to-red-50 text-rose-700 border border-rose-200'
                          }`}>
                            <span className={`mr-2 block h-2 w-2 rounded-full animate-pulse ${
                              voto.estado === ESTADOS_VOTO.ACTIVO
                                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                                : voto.estado === ESTADOS_VOTO.COMPLETADO
                                  ? 'bg-primary-500 shadow-lg shadow-primary-500/50'
                                  : 'bg-rose-500 shadow-lg shadow-rose-500/50'
                            }`} />
                            {voto.estado.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="font-bold text-slate-600">
                            {new Date(voto.fecha_limite).toLocaleDateString('es-CO')}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/dashboard/votos/${voto.id}`}
                              className="group/btn relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-blue-50 px-3 py-2 text-xs font-bold text-primary-700 transition-all hover:border-primary-300 hover:shadow-lg hover:shadow-primary-200/50 hover:-translate-y-0.5"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                              </svg>
                              <span>Ver</span>
                            </Link>
                            {userRole && ['admin', 'tesorero'].includes(userRole) && (
                              <Link
                                href={`/dashboard/votos/editar/${voto.id}`}
                                className="group/btn relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 text-xs font-bold text-amber-700 transition-all hover:border-amber-300 hover:shadow-lg hover:shadow-amber-200/50 hover:-translate-y-0.5"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21H21v-3.75l-5.83-5.83a3 3 0 0 0-4.24 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 11 4.24-4.24a3 3 0 0 0-4.24-4.24L11 6.76a3 3 0 0 0 0 4.24z" />
                                </svg>
                                <span>Editar</span>
                              </Link>
                            )}
                            <Link
                              href={`/dashboard/pagos/nuevo?voto=${voto.id}`}
                              className="group/btn relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-all hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-200/50 hover:-translate-y-0.5"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.171-.879-1.172-2.303 0-3.182C10.536 7.719 11.768 7.5 12 7.5c1.45 0 2.9.549 4.003 1.657" />
                              </svg>
                              <span>Pago</span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                      </Link>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 text-slate-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                          </svg>
                        </div>
                        <p className="text-sm font-bold text-slate-600">No se encontraron votos que coincidan con los filtros aplicados.</p>
                        <p className="text-xs text-slate-500">Intenta ajustar los filtros o crear un nuevo voto.</p>
                      </div>
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