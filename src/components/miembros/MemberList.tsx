import React from 'react'
import Link from '@/components/OrgLink'
import styles from '@/styles/miembros-improved.module.css'
import { MiembroConVotos } from '@/types/miembros'
import SearchFilters from './SearchFilters'

interface MemberListProps {
  miembros: MiembroConVotos[]
  onSearch?: (query: string) => void
  onFilterChange?: (estado: string) => void
}

export default function MemberList({ miembros, onSearch, onFilterChange }: MemberListProps) {
  return (
    <div className={styles.membersScreen}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Miembros Activos ({miembros.length})</h1>
          <p className={styles.pageSubtitle}>
            Gestiona los miembros de la iglesia y sus votos
          </p>
        </div>
        <Link href="/dashboard/miembros/nuevo" className={styles.btnPrimary}>
          Nuevo Miembro
        </Link>
      </div>

      <SearchFilters onSearch={onSearch} onFilterChange={onFilterChange} />

      <div className={styles.membersGrid}>
        {miembros.map((miembro) => (
          <div key={miembro.id} className={styles.memberCard}>
            <div className={styles.memberHeader}>
              <div className={styles.memberAvatar}>
                <span>{miembro.nombres[0]}{miembro.apellidos[0]}</span>
              </div>
              <div className={styles.memberInfo}>
                <h3>{`${miembro.nombres} ${miembro.apellidos}`}</h3>
              </div>
            </div>

            <div className={styles.memberDetails}>
              <div className={styles.memberDetail}>
                <span className={styles.memberDetailLabel}>Email</span>
                <span className={styles.memberDetailValue}>
                  {miembro.email || 'No registrado'}
                </span>
              </div>
              <div className={styles.memberDetail}>
                <span className={styles.memberDetailLabel}>Teléfono</span>
                <span className={styles.memberDetailValue}>
                  {miembro.telefono || 'No registrado'}
                </span>
              </div>
              <div className={styles.memberDetail}>
                <span className={styles.memberDetailLabel}>Estado</span>
                <span className={`${styles.memberDetailValue} ${styles[miembro.estado]}`}>
                  {miembro.estado.charAt(0).toUpperCase() + miembro.estado.slice(1)}
                </span>
              </div>
              <div className={styles.memberDetail}>
                <span className={styles.memberDetailLabel}>Votos</span>
                <span className={styles.memberDetailValue}>
                  {miembro.votos_activos?.filter(v => v.estado === 'activo').length || 0} activos
                </span>
              </div>
            </div>

            <div className={styles.memberActions}>
              <Link 
                href={`/dashboard/miembros/${miembro.id}`}
                className={styles.btnSecondary}
              >
                Ver Detalles
              </Link>
              {miembro.votos_activos && miembro.votos_activos.length > 0 && (
                <Link 
                  href={`/dashboard/miembros/${miembro.id}/votos`}
                  className={styles.btnOutline}
                >
                  Ver Votos
                </Link>
              )}
            </div>
          </div>
        ))}

        {miembros.length === 0 && (
          <div className={styles.noResults}>
            <p>No se encontraron miembros activos</p>
          </div>
        )}
      </div>
    </div>
  )
}