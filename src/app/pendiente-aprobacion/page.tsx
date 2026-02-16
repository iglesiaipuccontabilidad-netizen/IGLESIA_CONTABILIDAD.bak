'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock, MessageCircle, CheckCircle2, Mail } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function PendienteContent() {
  const searchParams = useSearchParams()
  const orgSlug = searchParams.get('org')

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12 overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 blur-3xl animate-pulse" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-primary-500/20 to-blue-500/20 blur-3xl animate-pulse" style={{ animationDelay: '700ms' }} />
      </div>

      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5"></div>

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        <div className="rounded-3xl border border-white/10 bg-white/95 backdrop-blur-xl p-10 shadow-2xl">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl blur-2xl opacity-30 animate-pulse"></div>
              <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 ring-2 ring-amber-400/20">
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

            {/* Título */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                ¡Registro exitoso!
              </h1>
              <p className="text-base text-slate-700 font-medium">
                Tu iglesia está pendiente de aprobación
              </p>
            </div>

            {/* Pasos del proceso */}
            <div className="w-full space-y-4 text-left">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700">1. Registro completado</p>
                  <p className="text-xs text-green-600">Tu cuenta y organización han sido creadas</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">2. Revisión en proceso</p>
                  <p className="text-xs text-amber-600">
                    Nos pondremos en contacto contigo vía <strong>WhatsApp</strong> para coordinar la activación de tu cuenta
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <MessageCircle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-600">3. Activación</p>
                  <p className="text-xs text-slate-500">
                    Una vez confirmado el proceso, activaremos tu cuenta y podrás acceder al sistema
                  </p>
                </div>
              </div>
            </div>

            {/* Info adicional */}
            <div className="w-full rounded-xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm text-blue-700">
                <Mail className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
                También recibirás un correo de confirmación cuando tu cuenta sea aprobada.
              </p>
            </div>

            {/* Tiempo estimado */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              <span>Tiempo estimado de respuesta: <strong>24-48 horas</strong></span>
            </div>

            {/* Link a login */}
            <div className="pt-2 border-t border-slate-200 w-full">
              <p className="text-center text-sm text-slate-600">
                ¿Ya te aprobaron?{' '}
                <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Inicia sesión
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 IPUC - Sistema de Gestión Contable
        </p>
      </div>
    </div>
  )
}

export default function PendienteAprobacionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <PendienteContent />
    </Suspense>
  )
}
