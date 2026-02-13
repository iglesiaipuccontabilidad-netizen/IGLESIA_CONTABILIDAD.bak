import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from '@/components/OrgLink'
import {
  ArrowLeft,
  TrendingDown,
  Calendar,
  DollarSign,
  CreditCard,
  FileText,
  Edit,
  StickyNote,
  Folder,
} from 'lucide-react'
import { DetalleGastoActions } from '@/components/comites/DetalleGastoActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
    gastoId: string
  }
}

export default async function DetalleGastoPage({ params }: PageProps) {
  const { id, gastoId } = await params
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obtener rol del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  // Verificar acceso al comité
  let hasAccess = isAdmin
  let rolEnComite = null

  if (!isAdmin) {
    const { data: comiteUsuario } = await supabase
      .from('comite_usuarios')
      .select('rol')
      .eq('comite_id', id)
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .single()

    hasAccess = !!comiteUsuario
    rolEnComite = comiteUsuario?.rol
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes acceso a este comité.
        </div>
      </div>
    )
  }

  // Obtener gasto con datos del comité y proyecto
  const { data: gasto, error: gastoError } = await supabase
    .from('comite_gastos')
    .select(`
      *,
      comites(nombre),
      comite_proyectos(nombre)
    `)
    .eq('id', gastoId)
    .eq('comite_id', id)
    .single()

  if (gastoError || !gasto) {
    console.error('Error al cargar gasto:', gastoError)
    return notFound()
  }

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  const comite = gasto.comites as any
  const proyecto = gasto.comite_proyectos as any

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/dashboard/comites/${id}/gastos`}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Gastos
          </Link>

          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/30">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  Detalle del Gasto
                </h1>
                <p className="text-slate-600">{comite.nombre}</p>
              </div>
            </div>

            {canManage && (
              <DetalleGastoActions gastoId={gastoId} comiteId={id} />
            )}
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Información del gasto */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card Principal */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  {gasto.concepto}
                </h2>
                {canManage && (
                  <Link
                    href={`/dashboard/comites/${id}/gastos/${gastoId}/editar`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                )}
              </div>

              {/* Monto destacado */}
              <div className="bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl p-6 mb-6 border border-rose-200">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-6 h-6 text-rose-600" />
                  <span className="text-sm font-medium text-rose-900">Monto del Gasto</span>
                </div>
                <p className="text-4xl font-bold text-rose-600">
                  ${gasto.monto.toLocaleString('es-CO')}
                </p>
              </div>

              {/* Detalles en grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">Fecha</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900 ml-6">
                      {new Date(gasto.fecha).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <CreditCard className="w-4 h-4" />
                      <span className="font-medium">Método de Pago</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900 ml-6 capitalize">
                      {gasto.metodo_pago}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {gasto.comprobante && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                        <FileText className="w-4 h-4" />
                        <span className="font-medium">Comprobante</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 ml-6">
                        {gasto.comprobante}
                      </p>
                    </div>
                  )}

                  {proyecto && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                        <Folder className="w-4 h-4" />
                        <span className="font-medium">Proyecto</span>
                      </div>
                      <p className="text-lg font-semibold text-slate-900 ml-6">
                        {proyecto.nombre}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nota */}
              {gasto.nota && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <StickyNote className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">Nota</p>
                      <p className="text-amber-800">{gasto.nota}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar con información adicional */}
          <div className="space-y-6">
            {/* Card de auditoría */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Información de Registro
              </h3>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-slate-600 mb-1">Registrado</p>
                  <p className="font-semibold text-slate-900">
                    {new Date(gasto.created_at).toLocaleDateString('es-CO', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Card de contexto */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200 p-6">
              <h3 className="text-lg font-bold text-blue-900 mb-3">
                Contexto
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Comité: <span className="font-semibold">{comite.nombre}</span>
                </p>
                {proyecto && (
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    Proyecto: <span className="font-semibold">{proyecto.nombre}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
