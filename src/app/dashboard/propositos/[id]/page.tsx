import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit, TrendingUp, Target, Calendar, Users, DollarSign } from 'lucide-react'
import type { Database } from '@/lib/database.types'

type Proposito = Database['public']['Tables']['propositos']['Row']
type Voto = Database['public']['Tables']['votos']['Row'] & {
  miembro: {
    id: string
    nombres: string
    apellidos: string
  }
}

export const dynamic = 'force-dynamic'

async function getPropositoConVotos(id: string) {
  const supabase = await createClient()
  
  const { data: proposito, error } = await supabase
    .from('propositos')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !proposito) {
    return null
  }
  
  const { data: votos } = await supabase
    .from('votos')
    .select(`
      *,
      miembro:miembros!miembro_id (
        id,
        nombres,
        apellidos
      )
    `)
    .eq('proposito_id', id)
    .order('created_at', { ascending: false })
  
  return {
    proposito: proposito as Proposito,
    votos: (votos || []) as Voto[]
  }
}

export default async function PropositoDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getPropositoConVotos(id)
  
  if (!data) {
    notFound()
  }
  
  const { proposito, votos } = data
  
  const progreso = proposito.monto_objetivo 
    ? Math.min(Math.round((proposito.monto_recaudado / proposito.monto_objetivo) * 100), 100)
    : 0
  
  const montoPendiente = proposito.monto_objetivo 
    ? proposito.monto_objetivo - proposito.monto_recaudado
    : 0
  
  const estadoBadge = proposito.estado === 'activo' 
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : proposito.estado === 'completado'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-800 border-gray-200'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/dashboard/propositos"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a propósitos
        </Link>
        <Link
          href={`/dashboard/propositos/${id}/editar`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
        >
          <Edit className="w-4 h-4" />
          Editar
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 mb-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {proposito.nombre}
            </h1>
            {proposito.descripcion && (
              <p className="text-slate-600">
                {proposito.descripcion}
              </p>
            )}
          </div>
          <span className={`px-4 py-2 text-sm font-medium rounded-full border ${estadoBadge}`}>
            {proposito.estado}
          </span>
        </div>

        {proposito.monto_objetivo && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Progreso del propósito</span>
              <span className="text-2xl font-bold text-slate-900">{progreso}%</span>
            </div>
            
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${progreso}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700 font-medium">Recaudado</p>
                  <p className="text-2xl font-bold text-green-900">
                    ${proposito.monto_recaudado.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium">Meta</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ${proposito.monto_objetivo.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-700 font-medium">Pendiente</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${montoPendiente.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fechas */}
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-slate-200">
          {proposito.fecha_inicio && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">
                Inicio: {new Date(proposito.fecha_inicio).toLocaleDateString('es-CO')}
              </span>
            </div>
          )}
          {proposito.fecha_fin && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">
                Fin: {new Date(proposito.fecha_fin).toLocaleDateString('es-CO')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Votos Asociados */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Votos Asociados
            </h2>
          </div>
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-medium rounded-full">
            {votos.length} {votos.length === 1 ? 'voto' : 'votos'}
          </span>
        </div>

        {votos.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600">
              No hay votos asociados a este propósito
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {votos.map((voto) => (
              <Link
                key={voto.id}
                href={`/dashboard/votos/${voto.id}`}
                className="block p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {voto.miembro.nombres} {voto.miembro.apellidos}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {voto.proposito}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      ${voto.recaudado.toLocaleString('es-CO')}
                    </p>
                    <p className="text-sm text-slate-500">
                      de ${voto.monto_total.toLocaleString('es-CO')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
