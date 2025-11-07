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
      <div className="max-w-4xl mx-auto px-4">
        {/* Header con navegación */}
        <div className="mb-8">
          <Link 
            href="/dashboard/votos" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 group transition-colors"
          >
            <svg 
              className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a la lista de votos
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900">
            Registrar Nuevo Pago
          </h1>
        </div>

        {/* Contenido Principal */}
        <div className="space-y-6">
          {/* Detalles del Voto - Card mejorada */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-primary-50 via-slate-50 to-cyan-50">
              <h2 className="text-lg font-medium text-slate-900 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Detalles del Voto
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Propósito y Miembro */}
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-4 border border-slate-200">
                  <label className="text-slate-600 text-sm font-medium block mb-1">Propósito</label>
                  <p className="text-slate-900 font-semibold">
                    {votoDetails.proposito || 'Sin propósito'}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-slate-50 to-white rounded-lg p-4 border border-slate-200">
                  <label className="text-slate-600 text-sm font-medium block mb-1">Miembro</label>
                  <p className="text-slate-900 font-semibold">
                    {`${votoDetails.miembro.nombres} ${votoDetails.miembro.apellidos}`}
                  </p>
                </div>
                
                {/* Montos */}
                <div className="bg-gradient-to-br from-primary-50 to-white rounded-lg p-4 border border-primary-100">
                  <label className="text-slate-600 text-sm font-medium block mb-1">Monto Total</label>
                  <p className="text-primary-700 text-xl font-bold">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0
                    }).format(votoDetails.monto_total)}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-rose-50 to-white rounded-lg p-4 border border-rose-100">
                  <label className="text-slate-600 text-sm font-medium block mb-1">Pendiente por Pagar</label>
                  <p className="text-rose-600 text-xl font-bold">
                    {new Intl.NumberFormat('es-CO', {
                      style: 'currency',
                      currency: 'COP',
                      minimumFractionDigits: 0
                    }).format(montoPendiente)}
                  </p>
                  <p className="text-rose-500 text-sm mt-1">
                    {((montoPendiente/votoDetails.monto_total) * 100).toFixed(1)}% del total
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <Suspense 
            fallback={
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 animate-pulse">
                <div className="h-8 bg-slate-100 rounded-lg w-1/3 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-12 bg-slate-100 rounded-lg"></div>
                  <div className="h-12 bg-slate-100 rounded-lg"></div>
                  <div className="h-12 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
            }
          >
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-rose-600 flex items-start">
          <svg className="w-6 h-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-semibold mb-1">Error al cargar la página</h3>
            <p className="text-rose-500">Por favor, intenta recargar la página. Si el problema persiste, contacta al administrador.</p>
          </div>
        </div>
      </div>
    )
  }
} 