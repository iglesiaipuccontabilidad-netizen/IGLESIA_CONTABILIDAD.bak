import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from '@/components/OrgLink'
import { ArrowLeft, Calendar, DollarSign, Tag, FileText, FolderOpen, User, Clock, Edit, Trash2 } from 'lucide-react'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
    ofrendaId: string
  }
}

export default async function OfrendaDetallePage({ params }: PageProps) {
  const { id, ofrendaId } = await params
  
  // SEGURIDAD: Validar acceso al comité
  const access = await requireComiteAccess(id)
  const isAdmin = access.isAdmin
  const rolEnComite = access.rolEnComite
  
  const supabase = await createClient()

  // Obtener comité
  const { data: comite, error: comiteError } = await supabase
    .from('comites')
    .select('nombre')
    .eq('id', id)
    .single()

  if (comiteError || !comite) {
    return notFound()
  }

  // Obtener ofrenda con relaciones
  const { data: ofrenda, error: ofrendaError } = await supabase
    .from('comite_ofrendas')
    .select(`
      *,
      comite_proyectos (
        id,
        nombre,
        descripcion
      )
    `)
    .eq('id', ofrendaId)
    .eq('comite_id', id)
    .single()

  if (ofrendaError || !ofrenda) {
    console.error('Error al cargar ofrenda:', ofrendaError)
    return notFound()
  }

  // Obtener información del usuario que registró
  let registradoPorNombre = 'Sistema'
  if (ofrenda.registrado_por) {
    const { data: usuario } = await supabase
      .from('organizacion_usuarios')
      .select('usuario_id')
      .eq('usuario_id', ofrenda.registrado_por)
      .eq('estado', 'activo')
      .maybeSingle()
    
    if (usuario && usuario.usuario_id) {
      registradoPorNombre = usuario.usuario_id
    }
  }

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  const tipoLabels: Record<string, string> = {
    diezmo: "Diezmo",
    ofrenda: "Ofrenda",
    primicia: "Primicia",
    donacion: "Donación",
    culto: "Culto",
    actividad: "Actividad",
    otro: "Otro",
  }

  const tipoColors: Record<string, string> = {
    diezmo: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ofrenda: "bg-blue-50 text-blue-700 border-blue-200",
    primicia: "bg-purple-50 text-purple-700 border-purple-200",
    donacion: "bg-pink-50 text-pink-700 border-pink-200",
    culto: "bg-indigo-50 text-indigo-700 border-indigo-200",
    actividad: "bg-amber-50 text-amber-700 border-amber-200",
    otro: "bg-slate-50 text-slate-700 border-slate-200",
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/dashboard/comites/${id}/ofrendas`}
            className="group inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-primary-300 group-hover:bg-primary-50 transition-all duration-200">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Volver a Ofrendas</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl blur-xl opacity-30 animate-pulse"></div>
                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <DollarSign className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-1">
                      Detalle de Ofrenda
                    </h1>
                    <p className="text-lg text-primary-600 font-semibold">
                      {comite.nombre}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center gap-3">
                {canManage && (
                  <Link
                    href={`/dashboard/comites/${id}/ofrendas/${ofrendaId}/editar`}
                    className="inline-flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-600 transition-all duration-200 hover:scale-105"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monto destacado */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500 mb-2">Monto</p>
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 blur-2xl opacity-20"></div>
                  <p className="relative text-6xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                    ${ofrenda.monto.toLocaleString('es-CO')}
                  </p>
                </div>
                <p className="text-sm text-slate-500 mt-2">COP</p>
              </div>
            </div>

            {/* Información principal */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Información General</h2>
              
              <div className="space-y-5">
                {/* Concepto */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 mb-1">Concepto</p>
                    <p className="text-base font-semibold text-slate-900">
                      {ofrenda.concepto || 'Sin concepto especificado'}
                    </p>
                  </div>
                </div>

                {/* Fecha */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 mb-1">Fecha</p>
                    <p className="text-base font-semibold text-slate-900">
                      {new Date(ofrenda.fecha).toLocaleDateString('es-CO', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Tipo */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Tag className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500 mb-1">Tipo</p>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border ${tipoColors[ofrenda.tipo] || tipoColors.otro}`}>
                      {tipoLabels[ofrenda.tipo] || 'Otro'}
                    </span>
                  </div>
                </div>

                {/* Nota (si existe) */}
                {ofrenda.nota && (
                  <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500 mb-1">Nota</p>
                      <p className="text-base text-slate-700">
                        {ofrenda.nota}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Columna lateral */}
          <div className="space-y-6">
            {/* Proyecto asociado */}
            {ofrenda.comite_proyectos && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">Proyecto</h3>
                </div>
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <p className="font-semibold text-indigo-900 mb-2">
                    {ofrenda.comite_proyectos.nombre}
                  </p>
                  {ofrenda.comite_proyectos.descripcion && (
                    <p className="text-sm text-indigo-700">
                      {ofrenda.comite_proyectos.descripcion}
                    </p>
                  )}
                </div>
                <Link
                  href={`/dashboard/comites/${id}/proyectos`}
                  className="mt-3 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Ver todos los proyectos →
                </Link>
              </div>
            )}

            {/* Metadatos */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Metadatos</h3>
              
              <div className="space-y-4">
                {/* Registrado por */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <User className="w-4 h-4" />
                    <span>Registrado por</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 ml-6">
                    {registradoPorNombre}
                  </p>
                </div>

                {/* Fecha de creación */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Fecha de registro</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 ml-6">
                    {new Date(ofrenda.created_at).toLocaleString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* ID */}
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <Tag className="w-4 h-4" />
                    <span>ID</span>
                  </div>
                  <p className="text-xs font-mono text-slate-600 ml-6 bg-slate-50 p-2 rounded">
                    {ofrenda.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
