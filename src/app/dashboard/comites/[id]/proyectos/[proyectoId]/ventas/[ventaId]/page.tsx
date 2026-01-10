import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ShoppingCart,
  User,
  Phone,
  Mail,
  Package,
  DollarSign,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Hash,
  Tag,
  FileText,
  BadgeCheck,
  History,
  TrendingUp,
  Receipt
} from 'lucide-react'
import { requireComiteAccess } from '@/lib/auth/comite-permissions'
import { DetalleVentaActions } from '@/components/comites/ventas/DetalleVentaActions'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: Promise<{
    id: string
    proyectoId: string
    ventaId: string
  }>
}

export default async function DetalleVentaPage({ params }: PageProps) {
  const { id, proyectoId, ventaId } = await params

  // SEGURIDAD: Validar acceso al comité
  const access = await requireComiteAccess(id)
  const isAdmin = access.isAdmin
  const rolEnComite = access.rolEnComite

  const supabase = await createClient()

  // Obtener venta con datos relacionados
  const { data: ventaRaw, error: ventaError } = await supabase
    .from('proyecto_ventas')
    .select(`
      *,
      proyecto_productos (
        id,
        nombre,
        precio_unitario,
        descripcion
      ),
      comite_proyectos (
        id,
        nombre,
        comites (
          id,
          nombre
        )
      )
    `)
    .eq('id', ventaId)
    .eq('proyecto_id', proyectoId)
    .single()

  if (ventaError || !ventaRaw) {
    console.error('Error al cargar venta:', ventaError)
    return notFound()
  }

  const venta = ventaRaw as any

  // Obtener pagos de la venta
  const { data: pagosRaw } = await supabase
    .from('proyecto_pagos_ventas')
    .select('*')
    .eq('venta_id', ventaId)
    .order('fecha_pago', { ascending: false })
    .order('created_at', { ascending: false })

  const pagos = pagosRaw as any
  const canManage = isAdmin || rolEnComite === 'lider' || rolEnComite === 'tesorero'

  // Calcular estadísticas
  const totalPagado = pagos?.reduce((sum: number, pago: any) => sum + (pago.monto || 0), 0) || 0
  const saldoPendiente = Math.max(0, venta.valor_total - totalPagado)
  const porcentajePagado = Math.min(Math.round((totalPagado / venta.valor_total) * 100), 100)

  const getEstadoStyles = (estado: string) => {
    switch (estado) {
      case 'pagado':
        return {
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-600',
          border: 'border-emerald-200',
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Pagado'
        }
      case 'pendiente':
        return {
          bg: 'bg-amber-500/10',
          text: 'text-amber-600',
          border: 'border-amber-200',
          icon: <Clock className="w-5 h-5" />,
          label: 'Pendiente'
        }
      case 'cancelado':
        return {
          bg: 'bg-rose-500/10',
          text: 'text-rose-600',
          border: 'border-rose-200',
          icon: <XCircle className="w-5 h-5" />,
          label: 'Cancelado'
        }
      default:
        return {
          bg: 'bg-slate-500/10',
          text: 'text-slate-600',
          border: 'border-slate-200',
          icon: <Tag className="w-5 h-5" />,
          label: estado
        }
    }
  }

  const styles = getEstadoStyles(venta.estado)

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/dashboard/comites/${id}/proyectos/${proyectoId}`}
            className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-medium text-sm"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:scale-110 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Volver al Proyecto
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden sm:inline">ID: #{venta.id.slice(0, 8)}</span>
            {canManage && venta.estado !== 'cancelado' && (
              <DetalleVentaActions
                ventaId={ventaId}
                proyectoId={proyectoId}
                comiteId={id}
                estado={venta.estado}
                saldoPendiente={saldoPendiente}
              />
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-8">
            {/* Payment Summary Header */}
            <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-1000"></div>

              <div className="relative z-10">
                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black border ${styles.bg} ${styles.text} ${styles.border} uppercase tracking-wider`}>
                    {styles.icon}
                    {styles.label}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-xs font-black uppercase tracking-wider">
                    <Hash className="w-4 h-4" />
                    VENTA #{venta.id.slice(0, 8)}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-2 tracking-tighter">
                      ${venta.valor_total.toLocaleString('es-CO')}
                    </h1>
                    <p className="text-slate-500 font-bold flex items-center gap-2 text-lg">
                      <Package className="w-6 h-6 text-indigo-500" strokeWidth={2.5} />
                      {venta.cantidad} x {(venta.proyecto_productos as any)?.nombre}
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="text-right mb-1">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Progreso de Pago</span>
                    </div>
                    <div className="w-48 bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(79,70,229,0.4)]"
                        style={{ width: `${porcentajePagado}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-black text-indigo-600 mt-2">{porcentajePagado}% Completado</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-10 border-t border-slate-100">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Recaudado</p>
                    <p className="text-xl font-black text-emerald-600">${totalPagado.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendiente</p>
                    <p className="text-xl font-black text-amber-600">${saldoPendiente.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Unitario</p>
                    <p className="text-xl font-black text-slate-700">${venta.precio_unitario.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-600 border border-indigo-700 shadow-lg shadow-indigo-100">
                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Fecha Venta</p>
                    <p className="text-sm font-black text-white">
                      {new Date(venta.fecha_venta).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buyer & Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 text-slate-50 group-hover:scale-110 transition-transform duration-500">
                  <User size={120} strokeWidth={1} />
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                    <User className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-6">Datos del Comprador</h3>
                  <div className="space-y-5">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre Completo</p>
                      <p className="text-lg font-bold text-slate-900">{venta.comprador_nombre}</p>
                    </div>
                    {venta.comprador_telefono && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono</p>
                        <a href={`tel:${venta.comprador_telefono}`} className="text-lg font-bold text-indigo-600 hover:underline">
                          {venta.comprador_telefono}
                        </a>
                      </div>
                    )}
                    {venta.comprador_email && (
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                        <p className="text-base font-bold text-slate-700">{venta.comprador_email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-4">Notas de la Venta</h3>
                  <p className="text-slate-500 font-medium leading-relaxed italic">
                    {venta.comprador_notas || "Sin observaciones registradas por el vendedor."}
                  </p>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-sm">
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-[10px] font-black text-indigo-600">
                      S
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atendido por</p>
                    <p className="text-sm font-bold text-slate-900">Sistema</p>
                  </div>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <History className="w-6 h-6 text-indigo-500" />
                  Registro de Abonos
                </h3>
                <span className="px-3 py-1 rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600 border border-indigo-100 uppercase">
                  {pagos?.length || 0} Operacioneso
                </span>
              </div>
              <div className="p-0">
                {!pagos || pagos.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-slate-400 font-bold">No se han registrado pagos para esta venta.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                          <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Monto</th>
                          <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Método</th>
                          <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ref</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pagos.map((pago: any) => (
                          <tr key={pago.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-5">
                              <span className="text-sm font-bold text-slate-900">
                                {new Date(pago.fecha_pago).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-base font-black text-emerald-600">
                              ${pago.monto.toLocaleString('es-CO')}
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center">
                                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">{pago.metodo_pago || 'Efectivo'}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                {pago.referencia || 'N/A'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-8">
            {/* System Context Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl"></div>
              <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                <BadgeCheck className="w-6 h-6 text-indigo-400" />
                Contexto
              </h3>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comité Responsable</p>
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-indigo-400" />
                    </div>
                    <p className="font-black text-sm tracking-tight">
                      {((venta.comite_proyectos as any)?.comites as any)?.nombre || 'General'}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Proyecto</p>
                  <p className="text-xl font-black text-indigo-300">
                    {(venta.comite_proyectos as any)?.nombre}
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Creado</p>
                    <p className="text-xs font-bold opacity-80">{new Date(venta.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Único</p>
                    <p className="text-[10px] font-mono font-bold opacity-50">#{venta.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Feature Card */}
            <div className="bg-indigo-50 rounded-[2.5rem] p-8 border border-indigo-100">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm">
                <Package className="w-7 h-7 text-indigo-600" strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-black text-indigo-900 mb-4">Información del Producto</h3>
              <p className="text-indigo-900/40 text-[10px] font-black uppercase tracking-widest mb-2">Descripción</p>
              <p className="text-indigo-900/70 text-sm font-medium leading-relaxed">
                {(venta.proyecto_productos as any)?.descripcion || "Este producto no cuenta con una descripción detallada cargada en el inventario actual de este proyecto."}
              </p>

              <div className="mt-8 pt-8 border-t border-indigo-200/50 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-indigo-900/40 uppercase tracking-widest">Base Unitario</p>
                  <p className="text-lg font-black text-indigo-900">${venta.precio_unitario.toLocaleString('es-CO')}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <DollarSign className="w-6 h-6 text-indigo-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}