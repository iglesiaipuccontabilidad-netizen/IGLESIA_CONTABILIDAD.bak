"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, Plus } from "lucide-react"
import { RegistrarPagoModal } from "./RegistrarPagoModal"

interface Pago {
  id: string
  monto: number
  fecha_pago: string
  metodo_pago: string
  numero_comprobante?: string
  observaciones?: string
  created_at: string
}

interface HistorialPagosClientProps {
  votoId: string
  comiteId: string
  pagos: Pago[]
  montoTotal: number
  montoPagado: number
  canManage: boolean
}

export function HistorialPagosClient({
  votoId,
  comiteId,
  pagos,
  montoTotal,
  montoPagado,
  canManage,
}: HistorialPagosClientProps) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)

  const handleSuccess = () => {
    router.refresh()
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Historial de Pagos
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Registro de todos los pagos realizados
            </p>
          </div>

          {canManage && montoPagado < montoTotal && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all text-sm"
            >
              <Plus className="w-4 h-4" />
              Registrar Pago
            </button>
          )}
        </div>

        {pagos.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay pagos registrados</p>
            {canManage && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all text-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Primer Pago
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Comprobante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                    Observaciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pagos.map((pago) => (
                  <tr key={pago.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {new Date(pago.fecha_pago).toLocaleDateString('es-CO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-emerald-600">
                        ${pago.monto.toLocaleString('es-CO')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200 capitalize">
                        {pago.metodo_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {pago.numero_comprobante || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="max-w-xs truncate">
                        {pago.observaciones || '-'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RegistrarPagoModal
        votoId={votoId}
        comiteId={comiteId}
        montoTotal={montoTotal}
        montoPagado={montoPagado}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
