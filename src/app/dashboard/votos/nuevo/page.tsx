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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 px-4 py-8">
      <div className="container max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Nuevo Voto</h1>
                <p className="text-blue-100 text-sm">Registra un nuevo compromiso financiero</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="text-white text-sm font-medium">{miembros?.length || 0} miembros disponibles</span>
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