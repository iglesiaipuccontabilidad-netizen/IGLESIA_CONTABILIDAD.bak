"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
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

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (showPagoModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showPagoModal])

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
        setShowDeleteModal(false)
        // Usar replace para evitar que se intente recargar la página eliminada
        router.replace(`/dashboard/comites/${comiteId}/proyectos/${proyectoId}`)
      } else {
        toast.error(result.error || "Error al eliminar la venta")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Error:", error)
      toast.error("Error inesperado al eliminar la venta")
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 relative z-10">
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
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border-2 border-slate-200 shadow-xl z-20">
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
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
            </>
          )}
        </div>
      </div>

      {/* Modal de Registrar Pago - Bottom Sheet con Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence mode="wait">
          {showPagoModal && (
            <>
              {/* Fondo oscuro con fade */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                style={{ zIndex: 9998 }}
                onClick={() => setShowPagoModal(false)}
              />

              {/* Modal - Bottom Sheet con slide up */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto bg-white rounded-t-[2.5rem] shadow-2xl border-t border-emerald-100 pb-safe"
                style={{ zIndex: 9999 }}
              >
                {/* Tirador visual */}
                <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-2" />

                {/* Header */}
                <div className="px-6 py-4 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <CreditCard className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Registrar Pago</h3>
                      <p className="text-sm text-slate-500 font-bold">
                        Saldo Pendiente: <span className="text-emerald-600">${saldoPendiente.toLocaleString('es-CO')}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPagoModal(false)}
                    className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-all hover:rotate-90"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Formulario */}
                <form onSubmit={handlePagoSubmit} className="px-6 pb-12 space-y-6">
                  {/* Monto Principal */}
                  <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 group focus-within:border-emerald-500 transition-all">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                      💰 Monto a Abonar
                    </label>
                    <div className="relative">
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-black text-emerald-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={saldoPendiente}
                        placeholder="0.00"
                        value={pagoForm.monto}
                        onChange={(e) => setPagoForm(prev => ({ ...prev, monto: e.target.value }))}
                        className="w-full pl-14 py-2 text-5xl font-black text-slate-900 bg-transparent border-none focus:ring-0 placeholder:text-slate-200"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Grid Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        📅 Fecha del Pago
                      </label>
                      <input
                        type="date"
                        value={pagoForm.fecha_pago}
                        onChange={(e) => setPagoForm(prev => ({ ...prev, fecha_pago: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-bold text-slate-700"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        🏦 Método de Pago
                      </label>
                      <select
                        value={pagoForm.metodo_pago}
                        onChange={(e) => setPagoForm(prev => ({ ...prev, metodo_pago: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-bold text-slate-700 appearance-none shadow-sm"
                        required
                      >
                        <option value="">Selecciona un método...</option>
                        <option value="efectivo">💵 Efectivo</option>
                        <option value="transferencia">🏦 Transferencia</option>
                        <option value="cheque">📝 Cheque</option>
                        <option value="tarjeta">💳 Tarjeta / Datáfono</option>
                        <option value="otro">📋 Otro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        📌 Referencia / Comprobante
                      </label>
                      <input
                        type="text"
                        placeholder="Opcional..."
                        value={pagoForm.referencia}
                        onChange={(e) => setPagoForm(prev => ({ ...prev, referencia: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-slate-700 shadow-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                        📝 Observaciones
                      </label>
                      <input
                        type="text"
                        placeholder="Notas adicionales..."
                        value={pagoForm.notas}
                        onChange={(e) => setPagoForm(prev => ({ ...prev, notas: e.target.value }))}
                        className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium text-slate-700 shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-4 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowPagoModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest text-xs"
                      disabled={isLoading}
                    >
                      Cerrar
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Confirmar Pago
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4"
          style={{ zIndex: 9999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDeleteModal(false)
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
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
    </>
  )
}
