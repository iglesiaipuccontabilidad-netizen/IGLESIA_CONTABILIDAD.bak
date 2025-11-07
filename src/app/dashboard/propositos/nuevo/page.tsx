import { Suspense } from 'react'
import PropositoForm from '@/components/propositos/PropositoForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NuevoPropositoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/dashboard/propositos"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a propósitos
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Nuevo Propósito</h1>
        <p className="text-slate-600">
          Crea un nuevo propósito o campaña financiera para la iglesia
        </p>
      </div>

      <Suspense fallback={<div>Cargando formulario...</div>}>
        <PropositoForm />
      </Suspense>
    </div>
  )
}
