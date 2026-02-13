'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { useRouter } from '@/lib/hooks/useOrgRouter'

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Error Boundary personalizado para capturar errores en producción
 * Este componente se muestra cuando ocurre un error en Server Components
 * 
 * Uso: Crear un archivo error.tsx en cualquier ruta del app directory
 * Next.js lo usará automáticamente para capturar errores
 */
export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter()

  useEffect(() => {
    // Log del error para debugging
    console.error('❌ Error capturado por Error Boundary:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    })
  }, [error])

  // Determinar mensaje amigable según el tipo de error
  const getErrorMessage = () => {
    const message = error.message.toLowerCase()
    
    if (message.includes('no tienes acceso') || message.includes('no autorizado')) {
      return {
        title: 'Acceso Denegado',
        description: 'No tienes permisos para realizar esta acción.',
        icon: '🔒',
      }
    }
    
    if (message.includes('no encontrado') || message.includes('not found')) {
      return {
        title: 'Recurso No Encontrado',
        description: 'El recurso que buscas no existe o fue eliminado.',
        icon: '🔍',
      }
    }
    
    if (message.includes('base de datos') || message.includes('database') || message.includes('supabase')) {
      return {
        title: 'Error de Conexión',
        description: 'Hubo un problema al conectar con la base de datos. Por favor, intenta nuevamente.',
        icon: '🔌',
      }
    }
    
    if (message.includes('validación') || message.includes('validation') || message.includes('inválido')) {
      return {
        title: 'Datos Inválidos',
        description: 'Los datos proporcionados no son válidos. Por favor, verifica e intenta nuevamente.',
        icon: '⚠️',
      }
    }
    
    // Error genérico
    return {
      title: 'Error Inesperado',
      description: 'Ocurrió un error inesperado. Por favor, intenta nuevamente o contacta al soporte.',
      icon: '❌',
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-red-500 to-rose-600 p-8 text-white">
          <div className="flex items-center justify-center mb-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <span className="text-5xl">{errorInfo.icon}</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-center mb-2">
            {errorInfo.title}
          </h1>
          <p className="text-center text-red-50 text-lg">
            {errorInfo.description}
          </p>
        </div>

        {/* Contenido */}
        <div className="p-8">
          {/* Mensaje de error técnico (solo en desarrollo) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-slate-100 rounded-lg border border-slate-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">
                    Mensaje técnico (solo visible en desarrollo):
                  </h3>
                  <p className="text-sm text-slate-700 font-mono break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-slate-500 mt-2">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información adicional en producción */}
          {process.env.NODE_ENV === 'production' && error.digest && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>ID del error:</strong> <code className="font-mono bg-blue-100 px-2 py-1 rounded">{error.digest}</code>
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Comparte este ID con el equipo de soporte para ayudar a resolver el problema.
              </p>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Intentar Nuevamente
            </button>
            
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all duration-200 font-medium"
            >
              <Home className="w-5 h-5" />
              Ir al Inicio
            </button>
          </div>

          {/* Tips de ayuda */}
          <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
              <span>💡</span> Sugerencias:
            </h3>
            <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
              <li>Verifica tu conexión a internet</li>
              <li>Asegúrate de tener los permisos necesarios</li>
              <li>Intenta cerrar sesión e iniciar sesión nuevamente</li>
              <li>Si el problema persiste, contacta al administrador</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
