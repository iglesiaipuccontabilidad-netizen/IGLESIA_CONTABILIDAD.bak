"use client"

import { useState } from "react"
import { Vote, Package, ShoppingCart, BarChart3, Download, FileText, FileSpreadsheet, Loader2, User, DollarSign } from "lucide-react"
import { ProyectoProductosTable } from "./productos/ProyectoProductosTable"
import { ProyectoVentasTable } from "./ventas/ProyectoVentasTable"
import { generarPDFVentasProyecto, generarExcelVentasProyecto } from "@/lib/utils/reportesComite"
import { useOrganization } from "@/lib/context/OrganizationContext"
import { useToast } from "@/lib/hooks/useToast"
import { ToastContainer } from "@/components/ui/Toast"

type TabType = "votos" | "productos" | "ventas" | "reportes"

interface ProyectoTabsProps {
  proyectoId: string
  comiteId: string
  canManage: boolean
  votosContent: React.ReactNode
  productos: any[]
  ventas: any[]
  resumenVentas: any
  onRefresh?: () => void
}

export function ProyectoTabs({
  proyectoId,
  comiteId,
  canManage,
  votosContent,
  productos,
  ventas,
  resumenVentas,
  onRefresh,
}: ProyectoTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("votos")
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const { toasts, removeToast, success, error: showError } = useToast()
  const { organization } = useOrganization()
  const orgNombre = organization?.nombre || 'IPUC'

  const handleExportPDF = async () => {
    setExportingPDF(true)
    try {
      const resultado = await generarPDFVentasProyecto({
        productos,
        ventas,
        resumenVentas,
        proyectoId,
        nombreOrganizacion: orgNombre
      })

      if (resultado.success) {
        success('✅ PDF exportado exitosamente', 4000)
        console.log('✅ PDF generado exitosamente')
      } else {
        showError('Error al generar el PDF: ' + resultado.mensaje, 5000)
      }
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      showError('Error al generar el PDF. Por favor intenta nuevamente.', 5000)
    } finally {
      setExportingPDF(false)
    }
  }

  const handleExportExcel = async () => {
    setExportingExcel(true)
    try {
      const resultado = await generarExcelVentasProyecto({
        productos,
        ventas,
        resumenVentas,
        proyectoId,
        nombreOrganizacion: orgNombre
      })

      if (resultado.success) {
        success('✅ Excel exportado exitosamente', 4000)
        console.log('✅ Excel generado exitosamente')
      } else {
        showError('Error al generar el Excel: ' + resultado.mensaje, 5000)
      }
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      showError('Error al generar el Excel. Por favor intenta nuevamente.', 5000)
    } finally {
      setExportingExcel(false)
    }
  }

  const tabs = [
    {
      id: "votos" as TabType,
      label: "Votos",
      icon: Vote,
      count: null,
    },
    {
      id: "productos" as TabType,
      label: "Productos",
      icon: Package,
      count: productos?.length || 0,
    },
    {
      id: "ventas" as TabType,
      label: "Ventas",
      icon: ShoppingCart,
      count: ventas?.length || 0,
    },
    {
      id: "reportes" as TabType,
      label: "Reportes",
      icon: BarChart3,
      count: null,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Tabs Header - Mejorada Responsividad */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-1.5 sm:p-2 shadow-sm sticky top-0 z-20 backdrop-blur-xl bg-white/95">
        <div className="flex overflow-x-auto scrollbar-hide sm:flex-wrap gap-1.5 sm:gap-3 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex-1 min-w-fit whitespace-nowrap px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-black transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm
                  ${isActive
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 scale-[1.02] sm:scale-105"
                    : "text-slate-500 hover:bg-slate-50 hover:text-purple-600"
                  }
                `}
              >
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'animate-pulse' : ''}`} />
                <span className="tracking-tight">{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={`
                      ml-0.5 px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-black
                      ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}
                    `}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "votos" && <div>{votosContent}</div>}

        {activeTab === "productos" && (
          <ProyectoProductosTable
            productos={productos}
            proyectoId={proyectoId}
            comiteId={comiteId}
            canManage={canManage}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === "ventas" && (
          <ProyectoVentasTable
            ventas={ventas}
            productos={productos}
            proyectoId={proyectoId}
            comiteId={comiteId}
            canManage={canManage}
            onRefresh={onRefresh}
          />
        )}

        {activeTab === "reportes" && (
          <div className="space-y-6">
            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Total Vendido</span>
                  <ShoppingCart className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  ${(resumenVentas?.valor_total_ventas || 0).toLocaleString("es-CO")}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {resumenVentas?.total_ventas || 0} ventas
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Total Recaudado</span>
                  <BarChart3 className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-green-600">
                  ${(resumenVentas?.total_recaudado || 0).toLocaleString("es-CO")}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {resumenVentas?.ventas_pagadas || 0} pagadas
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Pendiente</span>
                  <Vote className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-amber-600">
                  ${(resumenVentas?.total_pendiente || 0).toLocaleString("es-CO")}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {resumenVentas?.ventas_pendientes || 0} pendientes
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Unidades</span>
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {resumenVentas?.unidades_vendidas || 0}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {resumenVentas?.productos_distintos || 0} productos
                </p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600">Compradores</span>
                  <User className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900">
                  {ventas ? [...new Set(ventas.map((v: any) => v.comprador_nombre))].length : 0}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Clientes únicos
                </p>
              </div>
            </div>

            {/* Detalles por Producto */}
            {productos && productos.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Ventas por Producto
                </h3>
                <div className="space-y-4">
                  {productos.map((producto: any) => {
                    const ventasProducto = ventas?.filter(
                      (v: any) => v.producto_id === producto.id
                    ) || []
                    const totalVentas = ventasProducto.length
                    const unidadesVendidas = ventasProducto.reduce(
                      (sum: number, v: any) => sum + v.cantidad,
                      0
                    )
                    const valorTotal = ventasProducto.reduce(
                      (sum: number, v: any) => sum + v.valor_total,
                      0
                    )
                    const recaudado = ventasProducto.reduce(
                      (sum: number, v: any) => sum + v.monto_pagado,
                      0
                    )

                    if (totalVentas === 0) return null

                    return (
                      <div
                        key={producto.id}
                        className="border border-slate-200 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">{producto.nombre}</h4>
                            <p className="text-sm text-slate-600">
                              ${producto.precio_unitario.toLocaleString("es-CO")} c/u
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-purple-600">
                              ${valorTotal.toLocaleString("es-CO")}
                            </p>
                            <p className="text-sm text-slate-600">{totalVentas} ventas</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                          <div>
                            <p className="text-xs text-slate-500">Unidades</p>
                            <p className="font-semibold text-slate-900">{unidadesVendidas}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Recaudado</p>
                            <p className="font-semibold text-green-600">
                              ${recaudado.toLocaleString("es-CO")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Pendiente</p>
                            <p className="font-semibold text-amber-600">
                              ${(valorTotal - recaudado).toLocaleString("es-CO")}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Compradores */}
            {ventas && ventas.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Compradores
                </h3>
                <div className="space-y-4">
                  {/* Estadísticas generales de compradores */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-700">Total Compradores</span>
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-blue-900">
                        {[...new Set(ventas.map((v: any) => v.comprador_nombre))].length}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Compradores únicos
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700">Compra Promedio</span>
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-green-900">
                        ${(ventas.reduce((sum: number, v: any) => sum + v.valor_total, 0) / ventas.length).toLocaleString("es-CO")}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        Por transacción
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-700">Unidades Promedio</span>
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-2xl font-bold text-purple-900">
                        {(ventas.reduce((sum: number, v: any) => sum + v.cantidad, 0) / ventas.length).toFixed(1)}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        Por compra
                      </p>
                    </div>
                  </div>

                  {/* Lista de compradores */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-slate-900 mb-3">Detalle por Comprador</h4>
                    <div className="space-y-3">
                      {(() => {
                        // Agrupar ventas por comprador
                        const compradoresMap = new Map<string, any[]>()
                        ventas.forEach((venta: any) => {
                          const nombre = venta.comprador_nombre
                          if (!compradoresMap.has(nombre)) {
                            compradoresMap.set(nombre, [])
                          }
                          compradoresMap.get(nombre)!.push(venta)
                        })

                        // Convertir a array y ordenar por total gastado
                        const compradores = Array.from(compradoresMap.entries())
                          .map(([nombre, ventasComprador]) => {
                            const totalCompras = ventasComprador.length
                            const totalUnidades = ventasComprador.reduce((sum: number, v: any) => sum + v.cantidad, 0)
                            const valorTotal = ventasComprador.reduce((sum: number, v: any) => sum + v.valor_total, 0)
                            const totalPagado = ventasComprador.reduce((sum: number, v: any) => sum + v.monto_pagado, 0)
                            const pendiente = valorTotal - totalPagado
                            const ultimaCompra = new Date(Math.max(...ventasComprador.map((v: any) => new Date(v.fecha_venta).getTime())))

                            return {
                              nombre,
                              totalCompras,
                              totalUnidades,
                              valorTotal,
                              totalPagado,
                              pendiente,
                              ultimaCompra,
                              ventas: ventasComprador
                            }
                          })
                          .sort((a, b) => b.valorTotal - a.valorTotal)

                        return compradores.map((comprador, index) => (
                          <div
                            key={comprador.nombre}
                            className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                  {comprador.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-slate-900">{comprador.nombre}</h5>
                                  <p className="text-xs text-slate-500">
                                    {comprador.totalCompras} compra{comprador.totalCompras !== 1 ? 's' : ''} •
                                    Última: {comprador.ultimaCompra.toLocaleDateString('es-CO')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-slate-900">
                                  ${comprador.valorTotal.toLocaleString("es-CO")}
                                </p>
                                <p className="text-sm text-slate-600">
                                  {comprador.totalUnidades} unidad{comprador.totalUnidades !== 1 ? 'es' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                              <div>
                                <p className="text-xs text-slate-500">Pagado</p>
                                <p className="font-semibold text-green-600">
                                  ${comprador.totalPagado.toLocaleString("es-CO")}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Pendiente</p>
                                <p className="font-semibold text-amber-600">
                                  ${comprador.pendiente.toLocaleString("es-CO")}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Estado</p>
                                <p className={`font-semibold ${comprador.pendiente === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                                  {comprador.pendiente === 0 ? 'Pagado' : 'Pendiente'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botón exportar */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Exportación de Reportes
                  </h3>
                  <p className="text-slate-600 mb-4 text-sm">
                    Exporta los datos de ventas y productos en formato PDF o Excel
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleExportPDF}
                      disabled={!ventas || ventas.length === 0 || exportingPDF}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md text-sm font-medium"
                    >
                      {exportingPDF ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4" />
                      )}
                      {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
                    </button>
                    <button
                      onClick={handleExportExcel}
                      disabled={!ventas || ventas.length === 0 || exportingExcel}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md text-sm font-medium"
                    >
                      {exportingExcel ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4" />
                      )}
                      {exportingExcel ? 'Exportando...' : 'Exportar Excel'}
                    </button>
                  </div>
                  {(!ventas || ventas.length === 0) && (
                    <p className="text-xs text-slate-500 mt-2">
                      * No hay datos de ventas para exportar
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast Container para notificaciones */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
