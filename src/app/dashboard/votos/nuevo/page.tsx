import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { NuevoVotoForm } from '@/components/votos/NuevoVotoForm'
import { redirect } from 'next/navigation'

type TablaMiembros = Database['public']['Tables']['miembros']['Row']

export default async function NuevoVotoPage() {
  const supabase = await createClient()
  
  // Verificar sesión
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    redirect('/login?redirect=/dashboard/votos/nuevo')
  }

  // Cargar miembros activos
  const { data: miembros, error: miembrosError } = await supabase
    .from('miembros')
    .select('id, nombres, apellidos, cedula')
    .eq('estado', 'activo')
    .order('apellidos', { ascending: true })
    .order('nombres', { ascending: true })

  if (miembrosError) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8">
        <div className="container max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar miembros</h3>
              <p className="text-sm text-gray-500">{miembrosError.message}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8 relative overflow-hidden">
      {/* Decoraciones de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-br from-slate-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
      </div>

      <div className="container max-w-4xl mx-auto relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden">
          {/* Header con gradiente colorido */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 px-8 py-6 relative overflow-hidden">
            {/* Patrón decorativo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>
            
            <div className="flex items-center justify-between relative z-10">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1 flex items-center space-x-3">
                  <span className="inline-block w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </span>
                  <span>Nuevo Voto</span>
                </h1>
                <p className="text-blue-100 text-sm mt-1">Registra un nuevo compromiso financiero</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 ring-2 ring-white/30">
                  <div className="flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                    <span className="text-white text-sm font-medium">{miembros?.length || 0} miembros disponibles</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="p-8">
            <NuevoVotoForm miembros={miembros || []} />
          </div>
        </div>
      </div>
    </main>
  )
}