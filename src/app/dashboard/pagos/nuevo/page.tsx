import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import RegistroPagoForm from '@/components/pagos/RegistroPagoForm'
import { getVotoDetails } from '@/lib/services/voto-service'
import styles from '@/styles/pagos.module.css'

// Configuración de la página
export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * Página para registrar un nuevo pago asociado a un voto
 * Esta página requiere autenticación y permisos de admin o tesorero
 */
export default async function NuevoPagoPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  try {
    // Esperar y extraer los searchParams de manera segura
    const params = await searchParams
    const votoId = params?.voto

    // Validar y extraer el ID del voto de los parámetros de manera segura
    if (!votoId || typeof votoId !== 'string') {
      console.warn('Intento de acceso sin ID de voto válido')
      redirect('/dashboard/votos')
    }

    // Obtener detalles del voto
    const votoDetails = await getVotoDetails(votoId)
    if (!votoDetails || !votoDetails.miembro) {
      console.error('Voto o información del miembro no encontrada:', { votoId })
      redirect('/dashboard/votos?error=voto-no-encontrado')
    }

    const montoPendiente = votoDetails.monto_total - (votoDetails.recaudado || 0)

    return (
      <div className={styles.container}>
        <nav className={styles.breadcrumbs}>
          <Link href="/dashboard/votos" className={styles.breadcrumbLink}>
            ← Volver a la lista de votos
          </Link>
        </nav>

        <div className={styles.header}>
          <h1 className={styles.title}>Registrar Nuevo Pago</h1>
        </div>

        <div className={styles.content}>
          <div className={styles.votoInfo}>
            <h2 className={styles.subtitle}>Detalles del Voto</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Propósito:</span>
                <span className={styles.value}>{votoDetails.proposito}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Miembro:</span>
                <span className={styles.value}>
                  {votoDetails.miembro.nombres} {votoDetails.miembro.apellidos}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Monto Total:</span>
                <span className={styles.value}>
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }).format(votoDetails.monto_total)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Pendiente:</span>
                <span className={styles.value}>
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0
                  }).format(montoPendiente)}
                </span>
              </div>
            </div>
          </div>

          <Suspense fallback={<div>Cargando formulario...</div>}>
            <RegistroPagoForm 
              votoId={votoDetails.id} 
              montoPendiente={montoPendiente}
              montoTotal={votoDetails.monto_total}
            />
          </Suspense>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error en la página de nuevo pago:', error)
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error al cargar la página. Por favor, intenta de nuevo.
      </div>
    )
  }
} 