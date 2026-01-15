'use client'

import Image from 'next/image'
import { login } from './actions'
import { useRouter } from 'next/navigation'
import { ErrorBoundary } from 'react-error-boundary'
import { useEffect, useState, useTransition } from 'react'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'

// Componente de carga mejorado
function LoadingState() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12 overflow-hidden">
      {/* Efectos de fondo mejorados */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-primary-500/20 to-blue-500/20 blur-3xl animate-pulse delay-700" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Card de carga */}
      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/95 backdrop-blur-xl p-12 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Logo con efecto glow */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 ring-2 ring-blue-400/20">
                <Image
                  src="/icons/icon-512x512.png"
                  alt="Logo IPUC"
                  width={80}
                  height={80}
                  priority
                  className="drop-shadow-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Sistema IPUC
              </h2>
              <p className="text-sm text-slate-500">
                Preparando el sistema...
              </p>
            </div>

            {/* Spinner mejorado */}
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full border-4 border-blue-600 opacity-20"></div>
            </div>
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
  const [showPassword, setShowPassword] = useState(false)

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
        // Ejecutar la acción de servidor
        const result = await login(formData)

        if (result && result.error) {
          setError(result.error)
        } else if (result && result.success && result.redirect) {
          // Refrescar el estado del router para sincronizar cookies
          router.refresh()
          
          // Pequeña pausa para asegurar que las cookies se propaguen
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Usar window.location para una navegación limpia que recarga el estado
          window.location.href = result.redirect
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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12 overflow-hidden">
      {/* Efectos de fondo mejorados */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-primary-500/20 to-blue-500/20 blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }} />
      </div>

      {/* Grid pattern sutil */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>

      {/* Card principal mejorado */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="rounded-3xl border border-white/10 bg-white/95 backdrop-blur-xl p-10 shadow-2xl">
          <div className="flex flex-col space-y-8">
            {/* Header mejorado */}
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Logo con efecto glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 ring-2 ring-blue-400/20 hover:ring-blue-400/40 transition-all duration-300">
                  <Image
                    src="/icons/icon-512x512.png"
                    alt="Logo IPUC"
                    width={80}
                    height={80}
                    priority
                    className="drop-shadow-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Bienvenido
                </h1>
                <p className="text-sm text-slate-600 max-w-sm">
                  Accede al sistema de gestión contable de IPUC
                </p>
              </div>
            </div>

            {/* Formulario mejorado */}
            <form action={handleSubmit} className="space-y-5">
              {/* Email input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Correo electrónico
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                    placeholder="tu.correo@ipuc.org"
                  />
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 blur-xl transition-opacity group-focus-within:opacity-20"></div>
                </div>
              </div>

              {/* Password input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Contraseña
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 blur-xl transition-opacity group-focus-within:opacity-20"></div>
                </div>
              </div>

              {/* Mensaje de éxito */}
              {mensaje && (
                <div className="flex items-start gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50 px-4 py-3 animate-slide-down">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-emerald-700">{mensaje}</p>
                </div>
              )}

              {/* Mensaje de error */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 animate-slide-down">
                  <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {/* Botón de submit mejorado */}
              <button
                type="submit"
                disabled={isPending}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <span className="relative flex items-center gap-2">
                  {isPending ? (
                    <>
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Ingresar al Sistema</span>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-center text-xs text-slate-500">
                Sistema de Gestión Contable IPUC
              </p>
            </div>
          </div>
        </div>

        {/* Decoración inferior */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            © 2026 IPUC. Todos los derechos reservados.
          </p>
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
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
          <div className="rounded-xl bg-red-50 border-2 border-red-200 p-6 max-w-md">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-red-900">Error al cargar</h3>
                <p className="text-sm text-red-700 mt-1">
                  Ha ocurrido un error al cargar el formulario de inicio de sesión.
                </p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <LoginForm mensaje={mensaje} />
    </ErrorBoundary>
  )
}
