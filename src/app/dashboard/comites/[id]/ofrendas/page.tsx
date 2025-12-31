import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Plus, DollarSign, FileText } from 'lucide-react'
import { OfrendasList } from '@/components/comites/OfrendasList'
import { OfrendasStats } from '@/components/comites/OfrendasStats'
import { ExportButton } from '@/components/comites/ExportButton'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function OfrendasComitePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
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

  // Función para generar reporte
  const generarReporteOfrendas = (ofrendas: any[], nombreComite: string) => {
    const total = ofrendas.length
    const montoTotal = ofrendas.reduce((sum, o) => sum + o.monto, 0)
    const promedio = total > 0 ? montoTotal / total : 0

    const porTipo = ofrendas.reduce((acc, o) => {
      acc[o.tipo] = (acc[o.tipo] || 0) + o.monto
      return acc
    }, {} as Record<string, number>)

    let reporte = `REPORTE DE OFRENDAS - ${nombreComite.toUpperCase()}\n`
    reporte += `Fecha de generación: ${new Date().toLocaleDateString('es-CO')}\n\n`

    reporte += `ESTADÍSTICAS GENERALES:\n`
    reporte += `- Total de ofrendas: ${total}\n`
    reporte += `- Monto total: $${montoTotal.toLocaleString('es-CO')}\n`
    reporte += `- Promedio por ofrenda: $${promedio.toLocaleString('es-CO')}\n\n`

    reporte += `DISTRIBUCIÓN POR TIPO:\n`
    Object.entries(porTipo).forEach(([tipo, monto]) => {
      const montoNum = typeof monto === 'number' ? monto : 0
      const porcentaje = ((montoNum / montoTotal) * 100).toFixed(1)
      reporte += `- ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}: $${montoNum.toLocaleString('es-CO')} (${porcentaje}%)\n`
    })

    reporte += `\nDETALLE DE OFRENDAS:\n`
    ofrendas.forEach((ofrenda, index) => {
      reporte += `${index + 1}. ${new Date(ofrenda.fecha).toLocaleDateString('es-CO')} - ${ofrenda.tipo} - $${ofrenda.monto.toLocaleString('es-CO')}`
      if (ofrenda.concepto) reporte += ` - ${ofrenda.concepto}`
      if (ofrenda.proyecto_nombre) reporte += ` (Proyecto: ${ofrenda.proyecto_nombre})`
      reporte += `\n`
    })

    return reporte
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${id}/dashboard`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              Ofrendas: {comite.nombre}
            </h1>
            <p className="text-slate-600 mt-2">
              Gestiona los ingresos y ofrendas del comité
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExportButton
              comiteId={id}
              comiteNombre={comite.nombre}
              tipo="ofrendas"
              datos={ofrendasConProyecto}
            />
            <button
              onClick={() => {
                const reporte = generarReporteOfrendas(ofrendasConProyecto, comite.nombre)
                navigator.clipboard.writeText(reporte)
                alert('Reporte copiado al portapapeles')
              }}
              className="inline-flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
            >
              <FileText className="w-5 h-5" />
              Generar Reporte
            </button>
            {canManage && (
              <Link
                href={`/dashboard/comites/${id}/ofrendas/nueva`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
                Nueva Ofrenda
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <OfrendasStats ofrendas={ofrendasConProyecto} />

      {/* Lista de Ofrendas con filtros */}
      <OfrendasList ofrendas={ofrendasConProyecto} comiteId={id} />
    </div>
  )
}
