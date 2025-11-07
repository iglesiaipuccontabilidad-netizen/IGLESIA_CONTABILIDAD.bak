import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Database } from '@/lib/database.types'
import { formatCurrency, formatDate, getProgressStatus } from '@/utils/format'
import styles from '@/styles/components/VotoDetalle.module.css'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CookieOptions } from '@supabase/ssr'

type TablaVotos = Database['public']['Tables']['votos']['Row']
type TablaMiembros = Database['public']['Tables']['miembros']['Row']
type TablaPagos = Database['public']['Tables']['pagos']['Row']

const cookieOptions: CookieOptions = {
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  sameSite: 'lax'
}

interface VotoConDetalles extends TablaVotos {
  miembro: Pick<TablaMiembros, 'id' | 'nombres' | 'apellidos' | 'cedula'>
  pagos: Array<{
    id: string
    monto: number
    fecha_pago: string
    metodo_pago?: string
    nota?: string | null
    created_at?: string
    registrado_por?: string
    voto_id?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function VotoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // Validar el ID antes de usarlo
  const { id } = await Promise.resolve(params)
  
  if (!id) {
    return notFound()
  }

  const votoId = id
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Handle errors gracefully
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string) {
          try {
            cookieStore.set(name, '', { ...cookieOptions, maxAge: 0 })
          } catch (error) {
            // Handle errors gracefully
            console.error('Error removing cookie:', error)
          }
        }
      }
    }
  )

  const { data: voto, error } = await supabase
    .from('votos')
    .select(`
      *,
      miembro:miembros!miembro_id (
        id,
        nombres,
        apellidos,
        cedula
      ),
      pagos (
        id,
        created_at,
        fecha_pago,
        monto,
        voto_id,
        nota,
        registrado_por,
        metodo_pago
      )
    `)
    .eq('id', votoId)
    .single() as { data: VotoConDetalles | null, error: any }

  if (error) {
    console.error('Error al cargar el voto:', error.message)
    return notFound()
  }

  if (!voto) {
    console.error('No se encontró el voto')
    return notFound()
  }

  const progreso = Math.round((voto.recaudado || 0) / voto.monto_total * 100)
  const montoPendiente = voto.monto_total - (voto.recaudado || 0)
  const progressStatus = getProgressStatus(progreso)
  const pagosOrdenados = [...(voto.pagos || [])].sort(
    (a, b) => new Date(b.fecha_pago).getTime() - new Date(a.fecha_pago).getTime()
  )
  const ultimoPago = pagosOrdenados[0]
  const totalPagos = voto.pagos?.length ?? 0
  const promedioPago = totalPagos > 0 ? (voto.recaudado || 0) / totalPagos : 0
  const estadoLabel =
    voto.estado === 'cancelado'
      ? 'Cancelado'
      : montoPendiente <= 0
        ? 'Completado'
        : 'Activo'

  return (
    <div className={styles.wrapper}>
      <nav className={styles.breadcrumbs}>
        <Link href="/dashboard/votos" className={styles.breadcrumbLink}>
          ← Volver a la lista de votos
        </Link>
      </nav>

      <header className={styles.pageHeader}>
        <div>
          <p className={styles.pageSubtitle}>Dashboard · Sistema de Votos</p>
          <h1 className={styles.pageTitle}>Detalle del Voto</h1>
        </div>
        <span className={`${styles.statusBadge} ${styles[progressStatus]}`}>
          {estadoLabel}
        </span>
      </header>

      <section className={styles.summarySection}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryTop}>
            <div>
              <span className={styles.summaryLabel}>Pendiente por pagar</span>
              <p className={styles.summaryValue}>{formatCurrency(montoPendiente)}</p>
            </div>
            <span className={styles.summaryChip}>{progreso}% completado</span>
          </div>

          <div className={styles.summaryStats}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Meta</span>
              <span className={styles.statValue}>{formatCurrency(voto.monto_total)}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Recaudado</span>
              <span className={styles.statValue}>{formatCurrency(voto.recaudado || 0)}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Restante</span>
              <span className={styles.statValue}>{formatCurrency(montoPendiente)}</span>
            </div>
          </div>

          <div className={styles.summaryProgress}>
            <div className={styles.progressRail}>
              <div
                className={`${styles.progressFill} ${styles[progressStatus]}`}
                style={{ width: `${Math.min(progreso, 100)}%` }}
              />
            </div>
            <div className={styles.progressLegend}>
              <span>{formatCurrency(voto.recaudado || 0)}</span>
              <span>de {formatCurrency(voto.monto_total)}</span>
            </div>
          </div>
        </div>

        <div className={styles.actionCard}>
          <h3 className={styles.actionTitle}>Realizar un pago</h3>
          <p className={styles.actionDescription}>
            Registra un nuevo aporte y mantén actualizado el avance de este voto.
          </p>
          <ul className={styles.actionChecklist}>
            <li>Actualiza los montos en tiempo real</li>
            <li>Notifica al equipo tesorería de cada aporte</li>
            <li>Mantén la trazabilidad del compromiso</li>
          </ul>
          <Link
            href={`/dashboard/pagos/nuevo?voto=${votoId}`}
            className={`${styles.primaryButton} ${montoPendiente === 0 ? styles.buttonDisabled : ''}`}
            {...(montoPendiente === 0 ? { 'aria-disabled': true, tabIndex: -1 } : {})}
          >
            {montoPendiente === 0 ? 'Compromiso completado' : 'Registrar pago'}
          </Link>
          <span className={styles.deadline}>Fecha límite: {formatDate(voto.fecha_limite)}</span>
        </div>
      </section>

      <section className={styles.detailGrid}>
        <div className={styles.detailCard}>
          <div className={styles.detailHeader}>
            <div>
              <h2 className={styles.cardTitle}>{voto.proposito}</h2>
              <p className={styles.cardSubtitle}>
                Seguimiento del compromiso asignado al miembro.
              </p>
            </div>
            <span className={styles.tag}>{voto.estado}</span>
          </div>

          <div className={styles.memberInfo}>
            <div className={styles.memberAvatar}>
              {voto.miembro.nombres[0]}
              {voto.miembro.apellidos[0]}
            </div>
            <div className={styles.memberDetails}>
              <h3>{voto.miembro.nombres} {voto.miembro.apellidos}</h3>
              <span className={styles.memberCedula}>CC: {voto.miembro.cedula}</span>
            </div>
          </div>

          <div className={styles.highlights}>
            <div className={styles.highlightCard}>
              <span className={styles.highlightLabel}>Pagos registrados</span>
              <span className={styles.highlightValue}>{totalPagos}</span>
              <span className={styles.highlightSubValue}>
                {totalPagos === 1 ? '1 registro' : `${totalPagos} registros`}
              </span>
            </div>
            <div className={styles.highlightCard}>
              <span className={styles.highlightLabel}>Último pago</span>
              <span className={styles.highlightValue}>
                {ultimoPago ? formatDate(ultimoPago.fecha_pago) : 'Sin registros'}
              </span>
              {ultimoPago && (
                <span className={styles.highlightSubValue}>
                  {formatCurrency(ultimoPago.monto)} · {ultimoPago.metodo_pago || 'Método no especificado'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.metricsCard}>
          <h3 className={styles.metricsTitle}>Resumen financiero</h3>
          <div className={styles.metricsList}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Estado actual</span>
              <span className={styles.metricValue}>{estadoLabel}</span>
              <span className={styles.metricHint}>
                {montoPendiente <= 0
                  ? 'Este voto ya alcanzó su meta establecida.'
                  : 'Aún quedan aportes pendientes para cumplir la meta.'}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Promedio por pago</span>
              <span className={styles.metricValue}>
                {totalPagos > 0 ? formatCurrency(promedioPago) : '—'}
              </span>
              <span className={styles.metricHint}>
                {totalPagos > 0
                  ? `Basado en ${totalPagos} ${totalPagos === 1 ? 'aporte' : 'aportes'} registrados.`
                  : 'Registra el primer pago para calcular un promedio.'}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>Última actualización</span>
              <span className={styles.metricValue}>
                {voto.updated_at ? formatDate(voto.updated_at) : formatDate(voto.created_at)}
              </span>
              <span className={styles.metricHint}>
                {voto.updated_at ? 'Fecha del último ajuste del voto.' : 'Aún no se registran modificaciones posteriores.'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.paymentsCard}>
        <div className={styles.paymentsHeader}>
          <div>
            <h3 className={styles.paymentsTitle}>Historial de pagos</h3>
            <p className={styles.paymentsMeta}>
              Controla cada aporte realizado y mantén la trazabilidad del compromiso.
            </p>
          </div>
          <span className={styles.paymentsBadge}>{totalPagos} {totalPagos === 1 ? 'registro' : 'registros'}</span>
        </div>

        {totalPagos > 0 ? (
          <div className={styles.tableWrapper}>
            <table className={styles.paymentsTable}>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Nota</th>
                </tr>
              </thead>
              <tbody>
                {pagosOrdenados.map((pago) => (
                  <tr key={pago.id}>
                    <td className={styles.date}>{formatDate(pago.fecha_pago)}</td>
                    <td className={styles.amount}>{formatCurrency(pago.monto)}</td>
                    <td className={styles.method}>{pago.metodo_pago || 'No especificado'}</td>
                    <td>{pago.nota || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total recaudado</td>
                  <td colSpan={2}>{formatCurrency(voto.recaudado || 0)}</td>
                </tr>
                <tr>
                  <td colSpan={2}>Pendiente por recaudar</td>
                  <td colSpan={2}>{formatCurrency(montoPendiente)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Aún no se han registrado pagos para este voto.</p>
            <Link
              href={`/dashboard/pagos/nuevo?voto=${votoId}`}
              className={styles.emptyStateAction}
            >
              Registrar primer pago
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
