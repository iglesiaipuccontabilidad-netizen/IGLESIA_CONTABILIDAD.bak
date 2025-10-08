'use client'

import { login } from './actions'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import { useEffect, useState, useTransition } from 'react'

// Componente de carga que coincide exactamente con la estructura del formulario
function LoadingState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sistema de Votos IPUC
          </h2>
          <div className="mt-4 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-600">
            Cargando...
          </p>
        </div>
      </div>
    </div>
  )
}

interface LoginFormProps {
  mensaje?: string | null;
}

function LoginForm({ mensaje }: LoginFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await login(formData)
        
        if (result.error) {
          setError(result.error)
        } else if (result.success && result.redirect) {
          router.push(result.redirect)
        }
      } catch (e: any) {
        setError(e.message || 'Ha ocurrido un error al iniciar sesión')
      }
    })
  }

  if (isPending) {
    return <LoadingState />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sistema de Votos IPUC
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión para acceder al sistema
          </p>
        </div>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-t-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Correo electrónico"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="relative block w-full rounded-b-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="Contraseña"
              />
            </div>
          </div>

          {mensaje && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">{mensaje}</div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isPending}
              className={`group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isPending ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              {isPending ? (
                <div className="flex items-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  <span className="ml-2">Iniciando sesión...</span>
                </div>
              ) : (
                'Iniciar sesión'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/registro')}
              className="group relative flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
            >
              Registrarse
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Componente contenedor que maneja el estado de la hidratación
export default function LoginPage() {
  const [isHydrated, setIsHydrated] = useState(false)
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null)

  useEffect(() => {
    // Solo actualizar los parámetros de búsqueda después de la hidratación
    setSearchParams(new URLSearchParams(window.location.search))
    setIsHydrated(true)
  }, [])

  if (!isHydrated) {
    return <LoadingState />
  }

  const mensaje = searchParams?.get('mensaje') || null

  return (
    <ErrorBoundary
      fallback={
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            Ha ocurrido un error al cargar el formulario
          </div>
        </div>
      }
    >
      <LoginForm mensaje={mensaje} />
    </ErrorBoundary>
  )
}
            