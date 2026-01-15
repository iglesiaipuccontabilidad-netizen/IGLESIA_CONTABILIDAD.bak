'use client'

import { useState, useMemo } from 'react'
import { FileText, Download, FileSpreadsheet, TrendingUp, ShoppingCart, Loader2, Settings, X } from 'lucide-react'
import ReportFilter, { FilterState } from '@/components/reportes/ReportFilter'
import ReportTable from '@/components/reportes/ReportTable'
import ReportActions from '@/components/reportes/ReportActions'
import { useReportesVotos } from '@/hooks/useReportesVotos'
import { useReportesPagos } from '@/hooks/useReportesPagos'
import { useReportesMiembros } from '@/hooks/useReportesMiembros'
import { useReporteFinanciero } from '@/hooks/useReporteFinanciero'
import { useGraficosReportes } from '@/hooks/useGraficosReportes'
import { useReportesVentas } from '@/hooks/useReportesVentas'
import ResumenFinanciero from '@/components/reportes/ResumenFinanciero'
import DashboardFinancieroAvanzado from '@/components/reportes/DashboardFinancieroAvanzado'
import GraficoPropositos from '@/components/reportes/GraficoPropositos'
import GraficoEstadoVotos from '@/components/reportes/GraficoEstadoVotos'
import GraficoTendenciaPagos from '@/components/reportes/GraficoTendenciaPagos'
import VentasPorProducto from '@/components/reportes/VentasPorProducto'
import { useToast } from '@/lib/hooks/useToast'
import { ToastContainer } from '@/components/ui/Toast'
// Importaciones dinámicas para evitar errores si las dependencias no están instaladas
const importPDFGenerators = async () => {
  try {
    return await import('@/lib/utils/pdfGenerator')
  } catch (error) {
    console.error('PDFGenerator no disponible:', error)
    return null
  }
}

const importExcelExporters = async () => {
  try {
    return await import('@/lib/utils/excelExporter')
  } catch (error) {
    console.error('ExcelExporter no disponible:', error)
    return null
  }
}

type TipoReporte = 'votos' | 'miembros' | 'financiero' | 'pagos' | 'ventas'

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>('votos')
  const [filtros, setFiltros] = useState<FilterState>({
    busqueda: '',
    fechaInicio: '',
    fechaFin: '',
    estado: '',
    miembroId: '',
    propositoId: ''
  })
  const [exportingPDF, setExportingPDF] = useState(false)
  const [exportingExcel, setExportingExcel] = useState(false)
  const [showPDFOptions, setShowPDFOptions] = useState(false)
  const [pdfConfig, setPdfConfig] = useState({
    incluirLogo: true,
    colorTema: '#3B82F6',
    incluirResumen: true,
    orientacion: 'portrait' as 'portrait' | 'landscape',
    formato: 'a4' as 'a4' | 'letter'
  })
  const { toasts, removeToast, success, error: showError } = useToast()

  // Hooks de datos
  const votosData = useReportesVotos({
    busqueda: filtros.busqueda,
    estado: filtros.estado,
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin
  })

  const pagosData = useReportesPagos({
    busqueda: filtros.busqueda,
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin
  })

  const miembrosData = useReportesMiembros({
    busqueda: filtros.busqueda,
    estado: filtros.estado
  })

  const financieroData = useReporteFinanciero({
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin
  })

  const graficosData = useGraficosReportes({
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin
  })

  const ventasData = useReportesVentas({
    busqueda: filtros.busqueda,
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin
  })

  const reportes = [
    {
      id: 'votos' as TipoReporte,
      titulo: 'General de Votos',
      descripcion: 'Lista de votos con estado, monto total, recaudado y pendiente',
      icono: FileText,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'ventas' as TipoReporte,
      titulo: 'Ventas por Producto',
      descripcion: 'Análisis de ventas y recaudación por cada producto',
      icono: ShoppingCart,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'miembros' as TipoReporte,
      titulo: 'Reporte de Miembros',
      descripcion: 'Detalle por miembro con votos activos y compromisos',
      icono: FileText,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'financiero' as TipoReporte,
      titulo: 'Financiero Consolidado',
      descripcion: 'Totales globales de compromisos, recaudado y pendiente',
      icono: TrendingUp,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'pagos' as TipoReporte,
      titulo: 'Historial de Pagos',
      descripcion: 'Pagos realizados ordenados cronológicamente',
      icono: FileSpreadsheet,
      color: 'from-amber-500 to-orange-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Reportes
            </h1>
            <p className="text-sm md:text-base text-slate-600">
              Genera y exporta informes contables y administrativos
            </p>
          </div>
        </div>
      </div>

      {/* Grid de tipos de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {reportes.map((reporte) => {
          const Icon = reporte.icono
          const isSelected = tipoReporte === reporte.id

          return (
            <button
              key={reporte.id}
              onClick={() => setTipoReporte(reporte.id)}
              className={`relative overflow-hidden rounded-xl border-2 p-6 text-left transition-all duration-300 ${isSelected
                ? 'border-blue-500 bg-white shadow-xl scale-105'
                : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-lg'
                }`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${reporte.color} opacity-10 rounded-full -mr-16 -mt-16`}></div>

              <div className="relative">
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${reporte.color} mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {reporte.titulo}
                </h3>

                <p className="text-sm text-slate-600">
                  {reporte.descripcion}
                </p>

                {isSelected && (
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    Seleccionado
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Área de contenido del reporte */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header del reporte */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-1">
                {reportes.find(r => r.id === tipoReporte)?.titulo}
              </h2>
              <p className="text-sm text-slate-600">
                Configura los filtros y genera tu reporte
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowPDFOptions(true)}
                disabled={
                  (tipoReporte === 'votos' && votosData.loading) ||
                  (tipoReporte === 'pagos' && pagosData.loading) ||
                  (tipoReporte === 'miembros' && miembrosData.loading) ||
                  (tipoReporte === 'financiero' && financieroData.loading) ||
                  (tipoReporte === 'ventas' && ventasData.loading)
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">Configurar PDF</span>
              </button>
              <button
                onClick={handleExportExcel}
                disabled={
                  exportingExcel ||
                  (tipoReporte === 'votos' && votosData.loading) ||
                  (tipoReporte === 'pagos' && pagosData.loading) ||
                  (tipoReporte === 'miembros' && miembrosData.loading) ||
                  (tipoReporte === 'financiero' && financieroData.loading) ||
                  (tipoReporte === 'ventas' && ventasData.loading)
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {exportingExcel ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{exportingExcel ? 'Exportando...' : 'Exportar Excel'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-slate-200">
          <ReportFilter onFilterChange={setFiltros} />
        </div>

        {/* Resumen rápido */}
        {renderResumenRapido()}

        {/* Contenido del reporte */}
        <div className="p-6">
          {renderReporteContent()}
        </div>
      </div>

      {/* Toast Container para notificaciones */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Modal de opciones de PDF */}
      {showPDFOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Configurar PDF</h3>
              <button
                onClick={() => setShowPDFOptions(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={pdfConfig.incluirLogo}
                    onChange={(e) => setPdfConfig(prev => ({ ...prev, incluirLogo: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-slate-700">Incluir logo IPUC</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={pdfConfig.incluirResumen}
                    onChange={(e) => setPdfConfig(prev => ({ ...prev, incluirResumen: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-slate-700">Incluir resumen</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color del tema
                </label>
                <select
                  value={pdfConfig.colorTema}
                  onChange={(e) => setPdfConfig(prev => ({ ...prev, colorTema: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="#3B82F6">Azul</option>
                  <option value="#10B981">Verde</option>
                  <option value="#F59E0B">Ámbar</option>
                  <option value="#EF4444">Rojo</option>
                  <option value="#8B5CF6">Púrpura</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Orientación
                </label>
                <select
                  value={pdfConfig.orientacion}
                  onChange={(e) => setPdfConfig(prev => ({ ...prev, orientacion: e.target.value as 'portrait' | 'landscape' }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="portrait">Vertical</option>
                  <option value="landscape">Horizontal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Formato
                </label>
                <select
                  value={pdfConfig.formato}
                  onChange={(e) => setPdfConfig(prev => ({ ...prev, formato: e.target.value as 'a4' | 'letter' }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="a4">A4</option>
                  <option value="letter">Carta</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-slate-200">
              <button
                onClick={() => setShowPDFOptions(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {exportingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Función para renderizar resumen rápido
  function renderResumenRapido() {
    switch (tipoReporte) {
      case 'votos':
        const totalVotos = votosData.data.length
        const totalRecaudado = votosData.data.reduce((sum, v) => sum + Number(v.recaudado), 0)
        const totalPendiente = votosData.data.reduce((sum, v) => sum + Number(v.pendiente), 0)
        return (
          <div className="px-6 py-4 bg-blue-50 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalVotos}</div>
                <div className="text-sm text-blue-600">Total Votos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${totalRecaudado.toLocaleString()}</div>
                <div className="text-sm text-green-600">Recaudado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">${totalPendiente.toLocaleString()}</div>
                <div className="text-sm text-orange-600">Pendiente</div>
              </div>
            </div>
          </div>
        )

      case 'pagos':
        const totalPagos = pagosData.data.length
        const sumaPagos = pagosData.data.reduce((sum, p) => sum + Number(p.monto), 0)
        return (
          <div className="px-6 py-4 bg-green-50 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalPagos}</div>
                <div className="text-sm text-green-600">Total Pagos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${sumaPagos.toLocaleString()}</div>
                <div className="text-sm text-green-600">Monto Total</div>
              </div>
            </div>
          </div>
        )

      case 'miembros':
        const totalMiembros = miembrosData.data.length
        const totalComprometido = miembrosData.data.reduce((sum, m) => sum + Number(m.total_comprometido), 0)
        return (
          <div className="px-6 py-4 bg-purple-50 border-b border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalMiembros}</div>
                <div className="text-sm text-purple-600">Total Miembros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${totalComprometido.toLocaleString()}</div>
                <div className="text-sm text-purple-600">Comprometido Total</div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Función para renderizar el contenido según el tipo de reporte
  function renderReporteContent() {
    switch (tipoReporte) {
      case 'votos':
        return (
          <ReportTable
            columns={[
              { key: 'miembro_nombre', label: 'Miembro', sortable: true },
              { key: 'proposito', label: 'Propósito', sortable: true },
              { key: 'monto_total', label: 'Monto Total', format: (v) => `$${Number(v).toLocaleString()}`, sortable: true },
              { key: 'recaudado', label: 'Recaudado', format: (v) => `$${Number(v).toLocaleString()}`, sortable: true },
              { key: 'pendiente', label: 'Pendiente', format: (v) => `$${Number(v).toLocaleString()}`, sortable: true },
              { key: 'estado', label: 'Estado', sortable: true }
            ]}
            data={votosData.data}
            loading={votosData.loading}
            error={votosData.error}
          />
        )

      case 'ventas':
        return <VentasPorProducto datos={ventasData.datos} loading={ventasData.loading} />

      case 'pagos':
        return (
          <ReportTable
            columns={[
              { key: 'miembro_nombre', label: 'Miembro', sortable: true },
              { key: 'voto_proposito', label: 'Propósito', sortable: true },
              { key: 'monto', label: 'Monto', format: (v) => `$${Number(v).toLocaleString()}`, sortable: true },
              { key: 'fecha_pago', label: 'Fecha', sortable: true },
              { key: 'metodo_pago', label: 'Método', sortable: true }
            ]}
            data={pagosData.data}
            loading={pagosData.loading}
            error={pagosData.error}
          />
        )

      case 'miembros':
        return (
          <ReportTable
            columns={[
              { key: 'nombre_completo', label: 'Nombre', sortable: true },
              { key: 'email', label: 'Email', sortable: true },
              { key: 'votos_activos', label: 'Votos Activos', sortable: true },
              { key: 'total_comprometido', label: 'Comprometido', format: (v) => `$${Number(v).toLocaleString()}`, sortable: true },
              { key: 'total_pagado', label: 'Pagado', format: (v) => `$${Number(v).toLocaleString()}`, sortable: true },
              { key: 'total_pendiente', label: 'Pendiente', format: (v) => `$${Number(v).toLocaleString()}`, sortable: true }
            ]}
            data={miembrosData.data}
            loading={miembrosData.loading}
            error={miembrosData.error}
          />
        )

      case 'financiero':
        return (
          <div className="space-y-8">
            {/* Dashboard Financiero Avanzado */}
            <DashboardFinancieroAvanzado
              data={financieroData.data}
              loading={financieroData.loading}
            />

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraficoPropositos
                data={graficosData.datosPropositos}
                loading={graficosData.loading}
              />
              <GraficoEstadoVotos
                data={graficosData.datosEstadoVotos}
                loading={graficosData.loading}
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <GraficoTendenciaPagos
                data={graficosData.datosTendenciaPagos}
                loading={graficosData.loading}
              />
            </div>

            {/* Detalles adicionales del estado de votos */}
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Estado de Votos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-blue-900">Activos</span>
                  <span className="text-2xl font-bold text-blue-600">{financieroData.data?.votos_activos || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-900">Completados</span>
                  <span className="text-2xl font-bold text-green-600">{financieroData.data?.votos_completados || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <span className="text-sm font-medium text-red-900">Vencidos</span>
                  <span className="text-2xl font-bold text-red-600">{financieroData.data?.votos_vencidos || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  // Funciones de exportación
  async function handleExportPDF() {
    setExportingPDF(true)
    setShowPDFOptions(false) // Cerrar modal
    try {
      const pdfModule = await importPDFGenerators()

      if (!pdfModule) {
        showError('⚠️ Las dependencias de PDF no están instaladas. Por favor ejecuta: npm install jspdf jspdf-autotable', 6000)
        return
      }

      let resultado

      switch (tipoReporte) {
        case 'votos':
          if (votosData.data.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = pdfModule.generarPDFVotos(votosData.data, pdfConfig)
          break

        case 'ventas':
          if (ventasData.datos.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = pdfModule.generarPDFVentas(ventasData.datos, pdfConfig)
          break

        case 'pagos':
          if (pagosData.data.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = pdfModule.generarPDFPagos(pagosData.data, pdfConfig)
          break

        case 'miembros':
          if (miembrosData.data.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = pdfModule.generarPDFMiembros(miembrosData.data, pdfConfig)
          break

        case 'financiero':
          if (!financieroData.data) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = pdfModule.generarPDFFinanciero(financieroData.data, pdfConfig)
          break

        default:
          showError('Tipo de reporte no válido', 4000)
          return
      }

      if (resultado.success) {
        success('✅ PDF exportado exitosamente', 4000)
        console.log('✅ PDF generado exitosamente')
      } else {
        showError('Error al generar el PDF: ' + resultado.mensaje, 5000)
      }
    } catch (error) {
      console.error('Error al exportar PDF:', error)
      showError('Error al generar el PDF. Verifica que las dependencias estén instaladas.', 5000)
    } finally {
      setExportingPDF(false)
    }
  }

  async function handleExportExcel() {
    setExportingExcel(true)
    try {
      const excelModule = await importExcelExporters()

      if (!excelModule) {
        showError('⚠️ Las dependencias de Excel no están instaladas. Por favor ejecuta: npm install xlsx file-saver', 6000)
        return
      }

      let resultado

      switch (tipoReporte) {
        case 'votos':
          if (votosData.data.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = excelModule.exportarExcelVotos(votosData.data)
          break

        case 'ventas':
          if (ventasData.datos.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = excelModule.exportarExcelVentas(ventasData.datos)
          break

        case 'pagos':
          if (pagosData.data.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = excelModule.exportarExcelPagos(pagosData.data)
          break

        case 'miembros':
          if (miembrosData.data.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = excelModule.exportarExcelMiembros(miembrosData.data)
          break

        case 'financiero':
          if (!financieroData.data) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = excelModule.exportarExcelFinanciero(financieroData.data)
          break

        default:
          showError('Tipo de reporte no válido', 4000)
          return
      }

      if (resultado.success) {
        success('✅ Excel exportado exitosamente', 4000)
        console.log('✅ Excel generado exitosamente')
      } else {
        showError('Error al generar el Excel: ' + resultado.mensaje, 5000)
      }
    } catch (error) {
      console.error('Error al exportar Excel:', error)
      showError('Error al generar el Excel. Verifica que las dependencias estén instaladas.', 5000)
    } finally {
      setExportingExcel(false)
    }
  }
}
