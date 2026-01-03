import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import { ComiteOfrendaForm } from '@/components/comites/ComiteOfrendaForm'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
    ofrendaId: string
  }
}

export default async function EditarOfrendaPage({ params }: PageProps) {
  const { id, ofrendaId } = await params
  
  // SEGURIDAD: Validar acceso al comité
  const access = await requireComiteAccess(id)
  const isAdmin = access.isAdmin
  const rolEnComite = access.rolEnComite
  
  const supabase = await createClient()

  // Verificar permisos para editar
  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  if (!canManage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes permisos para editar ofrendas en este comité.
        </div>
      </div>
    )
  }

  // Obtener comité
  const { data: comite, error: comiteError } = await supabase
    .from('comites')
    .select('nombre')
    .eq('id', id)
    .single()

  if (comiteError || !comite) {
    return notFound()
  }

  // Obtener ofrenda
  const { data: ofrenda, error: ofrendaError } = await supabase
    .from('comite_ofrendas')
    .select('*')
    .eq('id', ofrendaId)
    .eq('comite_id', id)
    .single()

  if (ofrendaError || !ofrenda) {
    console.error('Error al cargar ofrenda:', ofrendaError)
    return notFound()
  }

  // Preparar datos iniciales para el formulario
  const initialData = {
    monto: ofrenda.monto.toString(),
    fecha_ofrenda: ofrenda.fecha,
    tipo_ofrenda: ofrenda.tipo as any,
    concepto: ofrenda.concepto || '',
    metodo_pago: 'efectivo' as any, // Por defecto
    numero_comprobante: ofrenda.nota || '',
    proyecto_id: ofrenda.proyecto_id || '',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href={`/dashboard/comites/${id}/ofrendas/${ofrendaId}`}
            className="group inline-flex items-center gap-2 text-slate-600 hover:text-primary-600 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-primary-300 group-hover:bg-primary-50 transition-all duration-200">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="font-medium">Volver al Detalle</span>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl blur-xl opacity-30"></div>
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <Edit className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-1">
                  Editar Ofrenda
                </h1>
                <p className="text-lg text-primary-600 font-semibold">
                  {comite.nombre}
                </p>
              </div>
            </div>
            <p className="text-slate-600 ml-20">
              Modifica la información de esta ofrenda
            </p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Información de la Ofrenda
            </h2>
            <p className="text-sm text-slate-600">
              Actualiza los campos que desees modificar
            </p>
          </div>

          <ComiteOfrendaForm 
            comiteId={id}
            ofrendaId={ofrendaId}
            initialData={initialData}
          />
        </div>

        {/* Advertencia */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 mb-1">
                Ten en cuenta
              </h3>
              <p className="text-sm text-amber-700">
                Los cambios afectarán las estadísticas y reportes del comité. Asegúrate de que la información sea correcta.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
