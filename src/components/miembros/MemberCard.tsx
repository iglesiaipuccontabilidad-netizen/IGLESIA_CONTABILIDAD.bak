import styles from '@/styles/miembros.module.css'
import Link from 'next/link'

type MemberCardProps = {
  id: string
  nombres: string
  apellidos: string
  email: string
  telefono: string
  votos_activos: { id: string }[]
}

export function MemberCard({ id, nombres, apellidos, email, telefono, votos_activos }: MemberCardProps) {
  const nombreCompleto = `${nombres} ${apellidos}`
  return (
    <div className={styles['member-card']}>
      <div className={styles['member-header']}>
        <div className={styles['member-avatar']}>
          {nombres[0]}
        </div>
        <div className={styles['member-info']}>
          <h3>{nombreCompleto}</h3>
        </div>
      </div>

      <div className={styles['member-details']}>
        <div className={styles['member-detail']}>
          <span className={styles['member-detail-label']}>Email</span>
          <span className={styles['member-detail-value']}>{email}</span>
        </div>
        <div className={styles['member-detail']}>
          <span className={styles['member-detail-label']}>Teléfono</span>
          <span className={styles['member-detail-value']}>{telefono}</span>
        </div>
      </div>

      <div className={styles['member-actions']}>
        <Link 
          href={`/miembros/${id}`}
          className={styles['btn-primary']}
        >
          Ver Perfil
        </Link>
        <div className={styles['votos-badge']}>
          {votos_activos.length} votos activos
        </div>
      </div>
    </div>
  )
}