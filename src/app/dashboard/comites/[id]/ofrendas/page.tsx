import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from '@/components/OrgLink'
import { ArrowLeft, TrendingUp, Plus, DollarSign } from 'lucide-react'
import { OfrendasList } from '@/components/comites/OfrendasList'
import { OfrendasStats } from '@/components/comites/OfrendasStats'
import { ExportButton } from '@/components/comites/ExportButton'
import { OfrendasActions } from '@/components/comites/OfrendasActions'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function OfrendasComitePage({ params }: PageProps) {
  const { id } = await params
  
  // SEGURIDAD: Validar acceso al comité
  const access = await requireComiteAccess(id)
  const isAdmin = access.isAdmin
  const rolEnComite = access.rolEnComite
  
  const supabase = await createClient()

  // Obtener comité
  const { data: comite, error: comiteError } = await supabase
    .from('comites')
    .select('*')
    .eq('id', id)
    .single()

  if (comiteError || !comite) {
    console.error('Error al cargar comité:', comiteError)
    return notFound()
  }

  // Obtener ofrendas del comité
  const { data: ofrendas, error: ofrendasError } = await supabase
    .from('comite_ofrendas')
    .select(`
      *,
      comite_proyectos (
        nombre
      )
    `)
    .eq('comite_id', id)
    .order('fecha', { ascending: false })

  if (ofrendasError) {
    console.error('Error al cargar ofrendas:', ofrendasError)
  }

  // Mapear ofrendas con nombre del proyecto
  const ofrendasConProyecto = ofrendas?.map(ofrenda => ({
    ...ofrenda,
    proyecto_nombre: ofrenda.comite_proyectos?.nombre
  })) || []

  // Calcular estadísticas
  const totalOfrendas = ofrendasConProyecto.length
  const montoTotal = ofrendasConProyecto.reduce((sum, o) => sum + o.monto, 0)

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'
  
  // Debug: Ver permisos en consola del servidor
  console.log('🔐 Permisos de usuario:')
  console.log('  - isAdmin:', isAdmin)
  console.log('  - rolEnComite:', rolEnComite)
  console.log('  - canManage:', canManage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb mejorado */}
        <div className="mb-6">
          <Link
            href={`/dashboard/comites/${id}/dashboard`}
            className="group inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-primary-300 group-hover:bg-primary-50 transition-all duration-200">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Volver al Dashboard</span>
          </Link>
        </div>

        {/* Header mejorado */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              {/* Título y descripción */}
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-1">
                      Ofrendas
                    </h1>
                    <p className="text-lg text-primary-600 font-semibold">
                      {comite.nombre}
                    </p>
                  </div>
                </div>
                <p className="text-slate-600 text-base ml-20">
                  Gestiona y visualiza los ingresos y ofrendas del comité
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap items-center gap-3">
                <ExportButton
                  comiteId={id}
                  comiteNombre={comite.nombre}
                  tipo="ofrendas"
                  datos={ofrendasConProyecto}
                />
                <OfrendasActions
                  ofrendas={ofrendasConProyecto}
                  comiteNombre={comite.nombre}
                  comiteId={id}
                />
                {canManage && (
                  <Link
                    href={`/dashboard/comites/${id}/ofrendas/nueva`}
                    className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-emerald-500/30 transition-all duration-300 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <Plus className="w-5 h-5 relative z-10" />
                    <span className="relative z-10">Nueva Ofrenda</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <OfrendasStats ofrendas={ofrendasConProyecto} />

        {/* Lista de Ofrendas con filtros */}
        <OfrendasList 
          ofrendas={ofrendasConProyecto} 
          comiteId={id}
          canManage={canManage}
          isAdmin={isAdmin}
        />
      </div>
    </div>
  )
}
