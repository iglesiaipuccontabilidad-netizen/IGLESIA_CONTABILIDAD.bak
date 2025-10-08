import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { formatCurrency, formatDate, getProgressStatus } from '@/utils/format'
import styles from '@/styles/components/VotoDetalle.module.css'

type TablaVotos = Database['public']['Tables']['votos']['Row']
type TablaMiembros = Database['public']['Tables']['miembros']['Row']

interface VotoConRelaciones extends TablaVotos {
  miembro: Pick<TablaMiembros, 'id' | 'nombres' | 'apellidos' | 'cedula'>
}

async function fetchVoto(votoId: string) {
  const res = await fetch(`/api/votos/${votoId}`)
  if (!res.ok) return null
  return res.json() as Promise<VotoConRelaciones>
}

export default async function VotoDetailPage({ params }: any) {
  const { votoId } = params
  const voto = await fetchVoto(votoId)

  if (!voto) {
    return notFound()
  }

  const progreso = Math.round((voto.recaudado || 0) / voto.monto_total * 100)
  const montoPendiente = voto.monto_total - (voto.recaudado || 0)

  return (
    <div className="container mx-auto p-4">
      <nav className={styles.breadcrumbs}>
        <Link href="/dashboard/votos" className={styles.breadcrumbLink}>
          ← Volver a la lista de votos
        </Link>
      </nav>

      <div className={styles.headerActions}>
        <h1 className={styles.title}>Detalle del Voto</h1>
        <Link
          href={`/dashboard/pagos/${voto.id}`}
          className={styles.registerPaymentButton}
        >
          Registrar Pago
        </Link>
      </div>

      <div className={styles.mainCard}>
        <div className={styles.cardContent}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{voto.proposito}</h2>
            <p className={styles.cardDate}>
              Fecha límite: {formatDate(voto.fecha_limite)}
            </p>
          </div>

          <div className={styles.memberInfo}>
            <div className={styles.memberAvatar}>
              {voto.miembro.nombres[0]}{voto.miembro.apellidos[0]}
            </div>
            <div className={styles.memberDetails}>
              <h3>{voto.miembro.nombres} {voto.miembro.apellidos}</h3>
              <span className={styles.memberCedula}>CC: {voto.miembro.cedula}</span>
            </div>
          </div>

          <div className={styles.financialInfo}>
            <div className={styles.infoRow}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Monto Total</span>
                <span className={styles.infoValue}>
                  {formatCurrency(voto.monto_total)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Recaudado</span>
                <span className={styles.infoValue}>
                  {formatCurrency(voto.recaudado || 0)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Pendiente</span>
                <span className={styles.infoValue}>{formatCurrency(montoPendiente)}</span>
              </div>
            </div>
          </div>

          <div className={styles.progressBarContainer}>
            <div className={styles.progressBar}>
              <div
                className={`${styles.progressBarFill} ${styles[getProgressStatus(progreso)]}`}
                style={{ width: `${progreso}%` }}
              ></div>
            </div>
            <div className={styles.progressBarLabel}>{progreso}% completado</div>
          </div>
        </div>
      </div>
    </div>
  )
}
