'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Mail, Lock, User, Church, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { validarInvitacion, aceptarInvitacion } from './actions'

type InvitacionData = {
  id: string
  email: string
  rol: string
  organizacion_id: string
  org_nombre: string
  org_slug: string
}

export default function InvitacionPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [invitacion, setInvitacion] = useState<InvitacionData | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    async function validate() {
      const result = await validarInvitacion(token)
      if (result.valid && result.invitacion) {
        setInvitacion(result.invitacion as InvitacionData)
      } else {
        setValidationError(result.error || 'Invitación inválida')
      }
      setLoading(false)
    }
    validate()
  }, [token])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.append('token', token)

    startTransition(async () => {
      try {
        const result = await aceptarInvitacion(formData)
        if (!result.success) {
          setError(result.error || 'Error al aceptar invitación')
        } else {
          setSuccess(true)
          // Redirigir al login tras aceptar
          setTimeout(() => {
            window.location.href = `/login?invited=true&org=${result.slug}`
          }, 2000)
        }
      } catch (err: any) {
        setError(err.message || 'Error inesperado')
      }
    })
  }

  const rolLabels: Record<string, string> = {
    admin: 'Administrador',
    tesorero: 'Tesorero',
    secretario: 'Secretario',
    digitador: 'Digitador',
    viewer: 'Visor',
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12 overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-primary-500/20 to-blue-500/20 blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />
      </div>

      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="rounded-3xl border border-white/10 bg-white/95 backdrop-blur-xl p-10 shadow-2xl">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-slate-600 text-sm">Verificando invitación...</p>
            </div>
          )}

          {/* Error de validación */}
          {!loading && validationError && (
            <div className="flex flex-col items-center space-y-4 py-8 text-center">
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Invitación inválida</h2>
              <p className="text-sm text-slate-600">{validationError}</p>
              <Link
                href="/login"
                className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg"
              >
                Ir al inicio de sesión
              </Link>
            </div>
          )}

          {/* Éxito */}
          {!loading && success && (
            <div className="flex flex-col items-center space-y-4 py-8 text-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">¡Invitación aceptada!</h2>
              <p className="text-sm text-slate-600">
                Ya eres parte de <span className="font-semibold">{invitacion?.org_nombre}</span>.
                Redirigiendo al inicio de sesión...
              </p>
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          )}

          {/* Formulario */}
          {!loading && invitacion && !success && (
            <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
              {/* Header */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
                  <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 ring-2 ring-blue-400/20">
                    <Image
                      src="/icons/icon-512x512.png"
                      alt="Logo IPUC"
                      width={56}
                      height={56}
                      priority
                      className="drop-shadow-lg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    Invitación
                  </h1>
                  <p className="text-sm text-slate-600">
                    Has sido invitado a <span className="font-semibold text-blue-600">{invitacion.org_nombre}</span> como{' '}
                    <span className="font-semibold">{rolLabels[invitacion.rol] || invitacion.rol}</span>
                  </p>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Email (readonly) */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Correo electrónico
                </label>
                <input
                  name="email"
                  type="email"
                  readOnly
                  value={invitacion.email}
                  className="block w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 cursor-not-allowed"
                />
              </div>

              {/* Nombre */}
              <div className="space-y-2">
                <label htmlFor="nombre" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Tu Nombre *
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                  placeholder="Tu nombre completo"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Contraseña *
                </label>
                <div className="relative group">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Aceptando...
                  </>
                ) : (
                  <>
                    Aceptar Invitación
                    <Church className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-200">
                <p className="text-center text-sm text-slate-600">
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
