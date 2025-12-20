'use client'

import Image from 'next/image'
import { login } from './actions'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import { useEffect, useState, useTransition } from 'react'

// Componente de carga que coincide exactamente con la estructura del formulario
function LoadingState() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-900 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-12 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-12 h-80 w-80 rounded-full bg-gradient-to-br from-blue-300/30 to-cyan-300/30 blur-3xl" />
        <div className="absolute top-1/2 left-12 h-64 w-64 rounded-full bg-gradient-to-br from-blue-200/20 to-cyan-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-10 shadow-2xl backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center justify-center rounded-2xl bg-blue-500/10 p-3">
            <Image
              src="/LogoIpuc.png"
              alt="Logo IPUC"
              width={72}
              height={72}
              priority
            />
          </div>
          <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Sistema de Votos IPUC
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Preparando el formulario de ingreso...
          </p>
          <div className="mt-10 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
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
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  // Obtener el parámetro redirect_to de la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect_to')
    setRedirectTo(redirect)
  }, [])

  async function handleSubmit(formData: FormData) {
    setError(null)
    // Agregar el redirectTo al formData si existe
    if (redirectTo) {
      formData.append('redirect_to', redirectTo)
    }
    
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-900 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-12 h-96 w-96 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/30 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-12 h-80 w-80 rounded-full bg-gradient-to-br from-blue-300/30 to-cyan-300/30 blur-3xl" />
        <div className="absolute top-1/2 left-12 h-64 w-64 rounded-full bg-gradient-to-br from-blue-200/20 to-cyan-300/20 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/95 p-10 shadow-2xl backdrop-blur">
        <div className="flex flex-col">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-3 ring-4 ring-blue-400/30">
              <Image
                src="/LogoIpuc.png"
                alt="Logo IPUC"
                width={72}
                height={72}
                priority
              />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Inicia sesión
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Accede al panel administrativo de IPUC Contabilidad
            </p>
          </div>

          <form action={handleSubmit} className="mt-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="tu.correo@ipuc.org"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Ingresa tu contraseña"
                />
              </div>
            </div>

            {mensaje && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {mensaje}
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <svg className="mt-0.5 h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className={`inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.01] hover:shadow-blue-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isPending ? 'cursor-not-allowed opacity-70' : ''
              }`}
            >
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                'Ingresar al panel'
              )}
            </button>
          </form>
        </div>
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
            