'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Building2, Mail, Lock, User, MapPin, Eye, EyeOff, Church, ArrowRight, CheckCircle2, Phone } from 'lucide-react'
import { registrarOrganizacion } from './actions'

export default function RegistroOrgPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [step, setStep] = useState<1 | 2>(1) // Wizard de 2 pasos

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const result = await registrarOrganizacion(formData)
        if (!result.success) {
          setError(result.error || 'Error al registrar')
        } else {
          // Redirigir a página de espera de aprobación
          window.location.href = `/pendiente-aprobacion?org=${result.slug}`
        }
      } catch (err: any) {
        setError(err.message || 'Error inesperado')
      }
    })
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12 overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-primary-500/20 to-blue-500/20 blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: '1000ms' }} />
      </div>

      {/* Grid pattern sutil */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>

      {/* Card principal */}
      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        <div className="rounded-3xl border border-white/10 bg-white/95 backdrop-blur-xl p-10 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
            {/* Header */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-4 ring-2 ring-blue-400/20">
                  <Image
                    src="/icons/icon-512x512.png"
                    alt="Logo IPUC"
                    width={64}
                    height={64}
                    priority
                    className="drop-shadow-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Registra tu Iglesia
                </h1>
                <p className="text-sm text-slate-600 max-w-sm">
                  Crea una cuenta para gestionar la contabilidad de tu congregación
                </p>
              </div>

              {/* Step indicator */}
              <div className="flex items-center gap-3 pt-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${step >= 1 ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </div>
                  Iglesia
                </div>
                <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />
                <div className={`flex items-center gap-1.5 text-xs font-medium ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${step >= 2 ? 'bg-blue-600' : 'bg-slate-300'}`}>
                    2
                  </div>
                  Cuenta
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 animate-shake">
                {error}
              </div>
            )}

            {/* Step 1: Datos de la iglesia */}
            <div className={step === 1 ? 'space-y-4' : 'hidden'}>
              {/* Nombre de la iglesia */}
              <div className="space-y-2">
                <label htmlFor="nombre_iglesia" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Church className="w-4 h-4 text-blue-600" />
                  Nombre de la Iglesia *
                </label>
                <div className="relative group">
                  <input
                    id="nombre_iglesia"
                    name="nombre_iglesia"
                    type="text"
                    required
                    className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                    placeholder="Ej: IPUC 3ra Villa Estadio"
                  />
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 blur-xl transition-opacity group-focus-within:opacity-20"></div>
                </div>
              </div>

              {/* Pastor */}
              <div className="space-y-2">
                <label htmlFor="pastor" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Pastor
                </label>
                <input
                  id="pastor"
                  name="pastor"
                  type="text"
                  className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                  placeholder="Nombre del pastor"
                />
              </div>

              {/* Ciudad y Departamento */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="ciudad" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Ciudad
                  </label>
                  <input
                    id="ciudad"
                    name="ciudad"
                    type="text"
                    className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                    placeholder="Ej: Bosconia"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="departamento" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Departamento
                  </label>
                  <input
                    id="departamento"
                    name="departamento"
                    type="text"
                    className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                    placeholder="Ej: Cesar"
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div className="space-y-2">
                <label htmlFor="whatsapp" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  WhatsApp *
                </label>
                <input
                  id="whatsapp"
                  name="whatsapp"
                  type="tel"
                  required
                  className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                  placeholder="Ej: +57 300 123 4567"
                />
                <p className="text-xs text-slate-500">Te contactaremos por este medio para coordinar la activación</p>
              </div>

              {/* Botón siguiente */}
              <button
                type="button"
                onClick={() => {
                  const nombre = (document.getElementById('nombre_iglesia') as HTMLInputElement)?.value
                  if (!nombre) {
                    setError('El nombre de la iglesia es obligatorio')
                    return
                  }
                  setError(null)
                  setStep(2)
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98]"
              >
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Step 2: Datos de cuenta admin */}
            <div className={step === 2 ? 'space-y-4' : 'hidden'}>
              {/* Nombre del administrador */}
              <div className="space-y-2">
                <label htmlFor="nombre_admin" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Tu Nombre *
                </label>
                <input
                  id="nombre_admin"
                  name="nombre_admin"
                  type="text"
                  required
                  className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                  placeholder="Tu nombre completo"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Correo electrónico *
                </label>
                <div className="relative group">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10 hover:border-slate-300"
                    placeholder="tu.correo@ejemplo.com"
                  />
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 blur-xl transition-opacity group-focus-within:opacity-20"></div>
                </div>
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
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 blur-xl transition-opacity group-focus-within:opacity-20"></div>
                </div>
                <p className="text-xs text-slate-500">Mínimo 8 caracteres</p>
              </div>

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:border-slate-300"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creando iglesia...
                    </>
                  ) : (
                    <>
                      Crear Iglesia
                      <Church className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Divider + links */}
            <div className="pt-2 border-t border-slate-200">
              <p className="text-center text-sm text-slate-600">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-400">
          Al registrarte aceptas nuestros términos de servicio
        </p>
      </div>
    </div>
  )
}
