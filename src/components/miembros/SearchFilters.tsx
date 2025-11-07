'use client'

import React from 'react'
import styles from '@/styles/miembros.module.css'

interface SearchFiltersProps {
  onSearch?: (query: string) => void
  onFilterChange?: (estado: string) => void 
}

export default function SearchFilters({ onSearch, onFilterChange }: SearchFiltersProps) {
  return (
    <div className={styles.searchSection}>
      <input
        type="search"
        placeholder="Buscar por nombre, cédula o email..."
        className={styles.searchInput}
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <select 
        className={styles.filterSelect}
        onChange={(e) => onFilterChange?.(e.target.value)}
      >
        <option value="">Todos los estados</option>
        <option value="activo">Activos</option>
        <option value="inactivo">Inactivos</option>
        <option value="pendiente">Pendientes</option>
      </select>
    </div>
  )
}