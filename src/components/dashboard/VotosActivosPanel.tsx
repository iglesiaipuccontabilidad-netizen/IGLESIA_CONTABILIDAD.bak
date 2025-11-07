'use client'

import { formatearCedula, formatearPeso } from '@/utils/format'
import styles from './VotosActivosPanel.module.css'

interface Voto {
  id: string
  proposito: string
  monto_total: number
  recaudado: number
  fecha_limite: string
  estado: string
  porcentaje_completado: number
  miembro: {
    nombres: string
    apellidos: string
    cedula: string
  }
}

interface VotosActivosPanelProps {
  votos: Voto[]
}

export default function VotosActivosPanel({ votos }: VotosActivosPanelProps) {
  if (!votos?.length) {
    return (
      <div className={styles.noVotos}>
        <p>No hay votos activos en este momento.</p>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Votos Activos</h3>
      <div className={styles.votosList}>
        {votos.map((voto) => (
          <div key={voto.id} className={styles.votoCard}>
            <div className={styles.votoHeader}>
              <span className={styles.votoProposito}>{voto.proposito}</span>
              <span className={styles.votoEstado}>
                {voto.porcentaje_completado === 100 ? 'Completado' : 'Activo'}
              </span>
            </div>

            <div className={styles.votoMontos}>
              <div className={styles.votoMonto}>
                <span className={styles.votoMontoLabel}>Meta</span>
                <span className={styles.votoMontoValue}>
                  {formatearPeso(voto.monto_total)}
                </span>
              </div>
              <div className={styles.votoMonto}>
                <span className={styles.votoMontoLabel}>Recaudado</span>
                <span className={styles.votoMontoValue}>
                  {formatearPeso(voto.recaudado)}
                </span>
              </div>
              <div className={styles.votoMonto}>
                <span className={styles.votoMontoLabel}>Restante</span>
                <span className={styles.votoMontoValue}>
                  {formatearPeso(voto.monto_total - voto.recaudado)}
                </span>
              </div>
            </div>

            <div className={styles.votoProgress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${voto.porcentaje_completado}%` }}
                />
              </div>
              <div className={styles.progressText}>
                <span>{voto.porcentaje_completado.toFixed(1)}% completado</span>
                <span>Fecha límite: {new Date(voto.fecha_limite).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={styles.miembroInfo}>
              <span className={styles.miembroNombre}>
                {voto.miembro.nombres} {voto.miembro.apellidos}
              </span>
              <span className={styles.miembroCedula}>
                CC: {formatearCedula(voto.miembro.cedula)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}