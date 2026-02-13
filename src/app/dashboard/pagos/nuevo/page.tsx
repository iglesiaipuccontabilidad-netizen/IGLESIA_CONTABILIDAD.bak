import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import Link from '@/components/OrgLink'
import RegistroPagoForm from '@/components/pagos/RegistroPagoForm'
import { getVotoDetails } from '@/lib/services/voto-service'
import styles from '@/styles/pagos.module.css'
import { ArrowLeft, FileText, User, DollarSign, AlertCircle, TrendingUp, Calendar } from 'lucide-react'

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Breadcrumbs mejorado */}
          <nav className="mb-6">
            <Link 
              href="/dashboard/votos" 
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              <span>Volver a votos</span>
            </Link>
          </nav>

          {/* Header mejorado */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Dashboard · Sistema de Pagos</p>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Registrar Nuevo Pago
                </h1>
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              Completa el formulario para registrar un nuevo aporte al voto seleccionado
            </p>
          </header>

          {/* Contenido Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar con resumen del voto */}
            <div className="lg:col-span-1 space-y-6">
              {/* Card de resumen */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-6">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Resumen del Voto</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Propósito</p>
                      <p className="font-semibold text-white">
                        {votoDetails.proposito || 'Sin propósito'}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100 text-sm mb-1">Miembro</p>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                          {votoDetails.miembro.nombres[0]}{votoDetails.miembro.apellidos[0]}
                        </div>
                        <p className="font-semibold text-white">
                          {`${votoDetails.miembro.nombres} ${votoDetails.miembro.apellidos}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stats financieros */}
                <div className="p-6 space-y-4 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Monto Total</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }).format(votoDetails.monto_total)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">Recaudado</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        minimumFractionDigits: 0
                      }).format(votoDetails.recaudado || 0)}
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-semibold text-gray-900">Pendiente</span>
                      </div>
                      <span className="text-xl font-bold text-orange-600">
                        {new Intl.NumberFormat('es-CO', {
                          style: 'currency',
                          currency: 'COP',
                          minimumFractionDigits: 0
                        }).format(montoPendiente)}
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                        style={{ width: `${((votoDetails.recaudado || 0) / votoDetails.monto_total * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {((montoPendiente/votoDetails.monto_total) * 100).toFixed(1)}% restante
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario principal */}
            <div className="lg:col-span-2">
              <Suspense 
                fallback={
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 animate-pulse">
                    <div className="h-8 bg-gray-100 rounded-lg w-1/3 mb-6"></div>
                    <div className="space-y-4">
                      <div className="h-12 bg-gray-100 rounded-lg"></div>
                      <div className="h-12 bg-gray-100 rounded-lg"></div>
                      <div className="h-12 bg-gray-100 rounded-lg"></div>
                      <div className="h-32 bg-gray-100 rounded-lg"></div>
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