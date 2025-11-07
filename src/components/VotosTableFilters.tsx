'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import styles from '@/styles/votos.module.css'

export default function VotosTableFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '')
  const [estadoFilter, setEstadoFilter] = useState(searchParams?.get('estado') || '')

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || '')
      if (searchQuery) {
        params.set('q', searchQuery)
      } else {
        params.delete('q')
      }
      if (estadoFilter) {
        params.set('estado', estadoFilter)
      } else {
        params.delete('estado')
      }
      router.push(`?${params.toString()}`)
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery, estadoFilter, router, searchParams])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEstadoFilter(e.target.value)
  }

  return (
    <div className={styles.filtersContainer}>
      <input
        type="text"
        placeholder="Buscar por prop�sito, miembro o c�dula..."
        value={searchQuery}
        onChange={handleSearchChange}
        className={styles.searchInput}
      />
      <select value={estadoFilter} onChange={handleEstadoChange} className={styles.selectInput}>
        <option value="">Todos los estados</option>
        <option value="activo">Activo</option>
        <option value="finalizado">Finalizado</option>
        <option value="pendiente">Pendiente</option>
      </select>
    </div>
  )
}
