"use client"

import { useState } from "react"
import { ShoppingCart, Plus, Eye, DollarSign, User, Phone, Mail, Package } from "lucide-react"
import Link from "@/components/OrgLink"
import { ProyectoVentaForm } from "./ProyectoVentaForm"
import { RegistrarPagoVentaForm } from "./RegistrarPagoVentaForm"

interface Producto {
  id: string
  nombre: string
  precio_unitario: number
  estado: string
}

interface Venta {
  id: string
  comprador_nombre: string
  comprador_telefono?: string
  comprador_email?: string
  comprador_notas?: string
  cantidad: number
  precio_unitario: number
  valor_total: number
  monto_pagado: number
  saldo_pendiente: number
  estado: string
  fecha_venta: string
  created_at: string
  proyecto_productos?: Producto
}

interface ProyectoVentasTableProps {
  ventas: Venta[]
  productos: Producto[]
  proyectoId: string
  comiteId: string
  canManage: boolean
  onRefresh?: () => void
}

export function ProyectoVentasTable({
  ventas,
  productos,
  proyectoId,
  comiteId,
  canManage,
  onRefresh,
}: ProyectoVentasTableProps) {
  const [showForm, setShowForm] = useState(false)
  const [pagoVentaId, setPagoVentaId] = useState<string | null>(null)

  const handleFormSuccess = () => {
    setShowForm(false)
    setPagoVentaId(null)
    if (onRefresh) onRefresh()
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pagado":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Pagado
          </span>
        )
      case "pendiente":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
            Pendiente
          </span>
        )
      case "cancelado":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
            Cancelado
          </span>
        )
      default:
        return null
    }
  }

  if (showForm) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Nueva Venta</h3>
            <p className="text-sm text-slate-600">Registra una venta a un comprador externo</p>
          </div>
        </div>
        <ProyectoVentaForm
          proyectoId={proyectoId}
          comiteId={comiteId}
          productos={productos}
          onSuccess={handleFormSuccess}
          onCancel={() => setShowForm(false)}
        />
      </div>
    )
  }

  if (pagoVentaId) {
    const venta = ventas.find((v) => v.id === pagoVentaId)
    if (!venta) return null

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Registrar Pago</h3>
            <p className="text-sm text-slate-600">
              Comprador: {venta.comprador_nombre} - Saldo: ${venta.saldo_pendiente.toLocaleString("es-CO")}
            </p>
          </div>
        </div>
        <RegistrarPagoVentaForm
          ventaId={pagoVentaId}
          saldoPendiente={venta.saldo_pendiente}
          onSuccess={handleFormSuccess}
          onCancel={() => setPagoVentaId(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con botón agregar */}
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Registrar Venta
          </button>
        </div>
      )}

      {/* Tabla de ventas */}
      {!ventas || ventas.length === 0 ? (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No hay ventas registradas</h3>
          <p className="text-slate-600 mb-4">
            Comienza a registrar ventas de productos a compradores externos
          </p>
          {canManage && productos.filter(p => p.estado === 'activo').length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              Registrar Primera Venta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {ventas.map((venta) => (
            <div key={venta.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              {/* Header de la venta */}
              <div className="p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-900">{venta.comprador_nombre}</span>
                      </div>
                      {getEstadoBadge(venta.estado)}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4" />
                        {venta.proyecto_productos?.nombre || "Producto"} × {venta.cantidad}
                      </div>
                      {venta.comprador_telefono && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {venta.comprador_telefono}
                        </div>
                      )}
                      {venta.comprador_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {venta.comprador_email}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-slate-600 mb-1">Total</div>
                    <div className="text-xl font-bold text-slate-900">
                      ${venta.valor_total.toLocaleString("es-CO")}
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      Pagado: ${venta.monto_pagado.toLocaleString("es-CO")}
                    </div>
                    {venta.saldo_pendiente > 0 && (
                      <div className="text-sm text-amber-600 font-medium">
                        Pendiente: ${venta.saldo_pendiente.toLocaleString("es-CO")}
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Link
                    href={`/dashboard/comites/${comiteId}/proyectos/${proyectoId}/ventas/${venta.id}`}
                    className="text-sm px-3 py-1.5 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Ver detalles
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
