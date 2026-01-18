'use client'

import { useEffect, useState } from 'react'

interface LoadingWithTimeoutProps {
  isLoading: boolean
  timeoutMs?: number
  onTimeout?: () => void
  children: React.ReactNode
  loadingMessage?: string
  timeoutMessage?: string
}

/**
 * Componente que muestra un loading state con timeout
 * Después del timeout, muestra un mensaje de error y botón para recargar
 */
export function LoadingWithTimeout({
  isLoading,
  timeoutMs = 15000,
  onTimeout,
  children,
  loadingMessage = 'Cargando...',
  timeoutMessage = 'La carga está tardando más de lo esperado'
}: LoadingWithTimeoutProps) {
  const [showTimeout, setShowTimeout] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setShowTimeout(false)
      setElapsedTime(0)
      return
    }

    const startTime = Date.now()
    
    // Actualizar tiempo transcurrido cada segundo
    const intervalId = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    // Timeout para mostrar mensaje de error
    const timerId = setTimeout(() => {
      setShowTimeout(true)
      onTimeout?.()
    }, timeoutMs)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timerId)
    }
  }, [isLoading, timeoutMs, onTimeout])

  if (!isLoading) {
    return <>{children}</>
  }

  if (showTimeout) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="p-8 rounded-lg bg-white shadow-lg flex flex-col items-center gap-4 text-center max-w-md">
          <svg 
            className="h-16 w-16 text-yellow-500" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {timeoutMessage}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Tiempo transcurrido: {elapsedTime} segundos
            </p>
            <p className="text-sm text-gray-500">
              Esto puede deberse a problemas de conexión o servidor sobrecargado
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              Recargar página
            </button>
            <button
              onClick={() => setShowTimeout(false)}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Esperar más
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
      <div className="p-6 rounded-lg bg-white shadow-sm flex flex-col items-center gap-4">
        <div className="relative">
          <svg 
            className="animate-spin h-12 w-12 text-blue-500" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base text-gray-700 font-medium">{loadingMessage}</p>
          {elapsedTime > 3 && (
            <p className="text-sm text-gray-500 mt-1">
              {elapsedTime} segundos...
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
