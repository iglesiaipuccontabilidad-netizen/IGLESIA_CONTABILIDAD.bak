import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, TrendingUp, Target, Calendar } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Proposito = Database['public']['Tables']['propositos']['Row']

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getPropositos() {
  const supabase = await createClient()
  
  const { data: propositos, error } = await supabase
    .from('propositos')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error al cargar propósitos:', error)
    return []
  }
  
  return propositos as Proposito[]
}

function PropositoCard({ proposito }: { proposito: Proposito }) {
  const progreso = proposito.monto_objetivo 
    ? Math.min(Math.round((proposito.monto_recaudado / proposito.monto_objetivo) * 100), 100)
    : 0
  
  const estadoBadge = proposito.estado === 'activo' 
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : proposito.estado === 'completado'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <Link 
      href={`/dashboard/propositos/${proposito.id}`}
      className="block group"
    >
      <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
              {proposito.nombre}
            </h3>
            {proposito.descripcion && (
              <p className="text-sm text-slate-600 line-clamp-2">
                {proposito.descripcion}
              </p>
            )}
          </div>
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${estadoBadge}`}>
            {proposito.estado}
          </span>
        </div>

        {proposito.monto_objetivo && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Progreso</span>
              <span className="font-semibold text-slate-900">{progreso}%</span>
            </div>
            
            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-slate-900">
                  ${proposito.monto_recaudado.toLocaleString('es-CO')}
                </span>
                <span className="text-slate-500">recaudado</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900">
                  ${proposito.monto_objetivo.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>
        )}

        {proposito.fecha_fin && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">
              Finaliza: {new Date(proposito.fecha_fin).toLocaleDateString('es-CO')}
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
          <div className="h-6 bg-slate-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-100 rounded w-full mb-4" />
          <div className="h-2 bg-slate-100 rounded w-full mb-4" />
          <div className="flex justify-between">
            <div className="h-4 bg-slate-100 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default async function PropositosPage() {
  const propositos = await getPropositos()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Propósitos</h1>
          <p className="text-slate-600">
            Gestiona campañas y objetivos financieros de la iglesia
          </p>
        </div>
        <Link
          href="/dashboard/propositos/nuevo"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Nuevo Propósito
        </Link>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        {propositos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No hay propósitos registrados
            </h3>
            <p className="text-slate-600 mb-6">
              Comienza creando tu primer propósito para organizar las campañas financieras
            </p>
            <Link
              href="/dashboard/propositos/nuevo"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Crear primer propósito
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propositos.map((proposito) => (
              <PropositoCard key={proposito.id} proposito={proposito} />
            ))}
          </div>
        )}
      </Suspense>
    </div>
  )
}
