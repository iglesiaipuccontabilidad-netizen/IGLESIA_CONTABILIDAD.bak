'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import tableStyles from '@/styles/components/Table.module.css'
import headerStyles from '@/styles/components/Header.module.css'
import loadingStyles from '@/styles/components/Loading.module.css'
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

      if (!data) {
        console.warn('No se encontraron votos')
        setVotos([])
        return
      }

      console.log('Votos cargados:', data)
      setVotos(data)
    } catch (error) {
      console.error('Error al cargar votos:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarVotos()
  }, [])

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
    
    const cumpleFechaInicio = !fecha_inicio || 
      new Date(voto.created_at) >= new Date(fecha_inicio)
    
    const cumpleFechaFin = !fecha_fin || 
      new Date(voto.created_at) <= new Date(fecha_fin)

    return cumpleBusqueda && cumpleProposito && cumpleEstado && 
           cumpleFechaInicio && cumpleFechaFin
  }, [filtros])

  const votosFiltrados = votos.filter(aplicarFiltros)

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(monto)
  }

    const calcularProgreso = (voto: VotoDetalle) => {
    return Math.min(Math.max((voto.recaudado || 0) / Number(voto.monto_total) * 100, 0), 100)
  }

  if (loading) {
    return (
      <div className={loadingStyles.loadingContainer}>
        <div className={loadingStyles.loading}></div>
        <p>Cargando votos...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className={headerStyles.header}>
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
            <path d="m8 12 2 2 4-4"/>
          </svg>
          Votos
        </h1>
        <Link
          href="/dashboard/votos/nuevo"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo Voto
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Buscar por nombre o propósito..."
          className="p-2 border rounded"
          value={filtros.busqueda}
          onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
        />
        <select
          className="p-2 border rounded"
          value={filtros.estado}
          onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
        >
          <option value="">Todos los estados</option>
          {Object.values(ESTADOS_VOTO).map(estado => (
            <option key={estado} value={estado}>
              {estado.charAt(0).toUpperCase() + estado.slice(1)}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            placeholder="Fecha inicio"
            className="p-2 border rounded"
            onChange={(e) => setFiltros(prev => ({ ...prev, fecha_inicio: e.target.value }))}
          />
          <input
            type="date"
            placeholder="Fecha fin"
            className="p-2 border rounded"
            onChange={(e) => setFiltros(prev => ({ ...prev, fecha_fin: e.target.value }))}
          />
        </div>
      </div>

      <div className={tableStyles.tableContainer}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Miembro</th>
              <th>Propósito</th>
              <th>Monto Total</th>
              <th>Recaudado</th>
              <th>Progreso</th>
              <th>Estado</th>
              <th>Fecha Límite</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {votosFiltrados.length > 0 ? (
              votosFiltrados.map((voto) => {
                const progreso = calcularProgreso(voto)
                
                return (
                  <tr key={voto.id}>
                    <td>
                      {voto.miembro
                        ? `${voto.miembro.nombres} ${voto.miembro.apellidos}`
                        : 'Sin asignar'}
                    </td>
                    <td>{voto.proposito}</td>
                    <td>{formatearMonto(Number(voto.monto_total))}</td>
                    <td>{formatearMonto(voto.total_pagado)}</td>
                    <td>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${progreso}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{progreso.toFixed(1)}%</span>
                    </td>
                    <td>
                      <span className={`px-2 py-1 rounded text-sm ${
                        voto.estado === ESTADOS_VOTO.ACTIVO ? 'bg-green-100 text-green-800' :
                        voto.estado === ESTADOS_VOTO.COMPLETADO ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {voto.estado}
                      </span>
                    </td>
                    <td>{new Date(voto.fecha_limite).toLocaleDateString('es-CO')}</td>
                    <td className="space-x-2">
                      <Link
                        href={`/dashboard/votos/${voto.id}`}
                        className="text-blue-500 hover:text-blue-700 inline-flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                        </svg>
                        Ver
                      </Link>
                      <Link
                        href={`/dashboard/pagos/nuevo?voto=${voto.id}`}
                        className="text-green-500 hover:text-green-700 inline-flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.171-.879-1.172-2.303 0-3.182C10.536 7.719 11.768 7.5 12 7.5c1.45 0 2.9.549 4.003 1.657" />
                        </svg>
                        Pago
                      </Link>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-500">
                  No se encontraron votos que coincidan con los filtros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}