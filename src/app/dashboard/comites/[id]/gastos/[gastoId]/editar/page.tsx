import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from '@/components/OrgLink'
import { ArrowLeft, TrendingDown } from 'lucide-react'
import { ComiteGastoForm } from '@/components/comites/ComiteGastoForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
    gastoId: string
  }
}

export default async function EditarGastoPage({ params }: PageProps) {
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

  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  if (!hasAccess || !canManage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes permisos para editar gastos en este comité.
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
    console.error('Error al cargar comité:', comiteError)
    return notFound()
  }

  // Obtener gasto
  const { data: gasto, error: gastoError } = await supabase
    .from('comite_gastos')
    .select('*')
    .eq('id', gastoId)
    .eq('comite_id', id)
    .single()

  if (gastoError || !gasto) {
    console.error('Error al cargar gasto:', gastoError)
    return notFound()
  }

  // Obtener balance del comité
  const { data: balanceData } = await supabase.rpc('obtener_balance_comite', {
    p_comite_id: id,
  })

  const balance = (Array.isArray(balanceData) ? balanceData[0] : balanceData) as { balance: number } || { balance: 0 }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/dashboard/comites/${id}/gastos/${gastoId}`}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Detalle
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center">
            <TrendingDown className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Editar Gasto</h1>
            <p className="text-slate-600 mt-1">{comite.nombre}</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Actualizar Información</h2>
          <p className="text-sm text-slate-600">
            Modifica los datos del gasto según sea necesario
          </p>
        </div>

        <ComiteGastoForm
          comiteId={id}
          gastoId={gastoId}
          initialData={{
            monto: gasto.monto,
            fecha: gasto.fecha,
            concepto: gasto.concepto,
            metodo_pago: gasto.metodo_pago as "efectivo" | "transferencia" | "cheque" | "otro",
            comprobante: gasto.comprobante || '',
            nota: gasto.nota || '',
          }}
          balanceDisponible={balance.balance + gasto.monto}
        />
      </div>
    </div>
  )
}
