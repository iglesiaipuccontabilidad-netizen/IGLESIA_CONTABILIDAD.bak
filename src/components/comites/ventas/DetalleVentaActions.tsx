"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Edit,
  Trash2,
  DollarSign,
  MoreVertical,
  AlertTriangle,
  CreditCard,
  Plus,
  X,
  Check
} from "lucide-react"
import { registrarPagoVenta, deleteProyectoVenta } from "@/app/actions/comites-actions"
import { toast } from "sonner"

interface DetalleVentaActionsProps {
  ventaId: string
  proyectoId: string
  comiteId: string
  estado: string
  saldoPendiente: number
}

export function DetalleVentaActions({
  ventaId,
  proyectoId,
  comiteId,
  estado,
  saldoPendiente,
}: DetalleVentaActionsProps) {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)
  const [showPagoModal, setShowPagoModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Estado para el formulario de pago
  const [pagoForm, setPagoForm] = useState({
    monto: "",
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: "",
    referencia: "",
    notas: ""
  })

  const handlePagoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const dto = {
        venta_id: ventaId,
        monto: parseFloat(pagoForm.monto),
        fecha_pago: pagoForm.fecha_pago,
        metodo_pago: pagoForm.metodo_pago as any,
        referencia: pagoForm.referencia || undefined,
        notas: pagoForm.notas || undefined
      }

      const result = await registrarPagoVenta(dto)

      if (result.success) {
        toast.success("Pago registrado exitosamente")
        setShowPagoModal(false)
        setPagoForm({
          monto: "",
          fecha_pago: new Date().toISOString().split('T')[0],
          metodo_pago: "",
          referencia: "",
          notas: ""
        })
        router.refresh()
      } else {
        toast.error(result.error || "Error al registrar el pago")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error inesperado al registrar el pago")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    setIsLoading(true)

    try {
      const result = await deleteProyectoVenta(ventaId)

      if (result.success) {
        toast.success("Venta eliminada exitosamente")
        router.push(`/dashboard/comites/${comiteId}/proyectos/${proyectoId}`)
      } else {
        toast.error(result.error || "Error al eliminar la venta")
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error inesperado al eliminar la venta")
    } finally {
      setIsLoading(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Botón Registrar Pago */}
        {estado !== 'cancelado' && saldoPendiente > 0 && (
          <button
            onClick={() => setShowPagoModal(true)}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Pago
          </button>
        )}

        {/* Menú de acciones */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="inline-flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold hover:border-slate-300 transition-colors"
          >
            <MoreVertical className="w-4 h-4 mr-2" />
            Acciones
          </button>

          {showMenu && (
            <>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border-2 border-slate-200 shadow-xl z-10">
                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      toast.info("Funcionalidad de edición próximamente")
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar Venta
                  </button>

                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setShowDeleteModal(true)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Venta
                  </button>
                </div>
              </div>

              {/* Overlay para cerrar menú */}
              <div
                className="fixed inset-0 z-0"
                onClick={() => setShowMenu(false)}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal de Registrar Pago */}
      {showPagoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Registrar Pago</h3>
                    <p className="text-sm text-slate-600">Saldo pendiente: ${saldoPendiente.toLocaleString('es-CO')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPagoModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handlePagoSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Monto *
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={pagoForm.monto}
                      onChange={(e) => setPagoForm(prev => ({ ...prev, monto: e.target.value }))}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha del Pago *
                  </label>
                  <input
                    type="date"
                    value={pagoForm.fecha_pago}
                    onChange={(e) => setPagoForm(prev => ({ ...prev, fecha_pago: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Método de Pago *
                  </label>
                  <select
                    value={pagoForm.metodo_pago}
                    onChange={(e) => setPagoForm(prev => ({ ...prev, metodo_pago: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona un método</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia Bancaria</option>
                    <option value="cheque">Cheque</option>
                    <option value="tarjeta">Tarjeta de Crédito/Débito</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="Número de recibo, comprobante, etc."
                    value={pagoForm.referencia}
                    onChange={(e) => setPagoForm(prev => ({ ...prev, referencia: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notas
                  </label>
                  <textarea
                    placeholder="Observaciones sobre el pago..."
                    value={pagoForm.notas}
                    onChange={(e) => setPagoForm(prev => ({ ...prev, notas: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPagoModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? "Registrando..." : "Registrar Pago"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Confirmar Eliminación</h3>
                  <p className="text-sm text-slate-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <p className="text-slate-700 mb-6">
                ¿Estás seguro de que deseas eliminar esta venta? Se eliminarán también todos los pagos asociados.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Eliminando..." : "Eliminar Venta"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar modales */}
      {(showPagoModal || showDeleteModal) && (
        <div className="fixed inset-0 z-40" onClick={() => {
          setShowPagoModal(false)
          setShowDeleteModal(false)
        }} />
      )}
    </>
  )
}