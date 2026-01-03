'use client'

import { useState, useMemo } from 'react'
import { FileText, Download, FileSpreadsheet, TrendingUp, ShoppingCart, Loader2 } from 'lucide-react'
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
                onClick={handleExportPDF}
                disabled={
                  exportingPDF ||
                  (tipoReporte === 'votos' && votosData.loading) ||
                  (tipoReporte === 'pagos' && pagosData.loading) ||
                  (tipoReporte === 'miembros' && miembrosData.loading) ||
                  (tipoReporte === 'financiero' && financieroData.loading) ||
                  (tipoReporte === 'ventas' && ventasData.loading)
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {exportingPDF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">{exportingPDF ? 'Exportando...' : 'Exportar PDF'}</span>
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

        {/* Contenido del reporte */}
        <div className="p-6">
          {renderReporteContent()}
        </div>
      </div>

      {/* Toast Container para notificaciones */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )

  // Función para renderizar el contenido según el tipo de reporte
  function renderReporteContent() {
    switch (tipoReporte) {
      case 'votos':
        return (
          <ReportTable
            columns={[
              { key: 'miembro_nombre', label: 'Miembro' },
              { key: 'proposito', label: 'Propósito' },
              { key: 'monto_total', label: 'Monto Total', format: (v) => `$${Number(v).toLocaleString()}` },
              { key: 'recaudado', label: 'Recaudado', format: (v) => `$${Number(v).toLocaleString()}` },
              { key: 'pendiente', label: 'Pendiente', format: (v) => `$${Number(v).toLocaleString()}` },
              { key: 'estado', label: 'Estado' }
            ]}
            data={votosData.data}
            loading={votosData.loading}
          />
        )

      case 'ventas':
        return <VentasPorProducto datos={ventasData.datos} loading={ventasData.loading} />

      case 'pagos':
        return (
          <ReportTable
            columns={[
              { key: 'miembro_nombre', label: 'Miembro' },
              { key: 'voto_proposito', label: 'Propósito' },
              { key: 'monto', label: 'Monto', format: (v) => `$${Number(v).toLocaleString()}` },
              { key: 'fecha_pago', label: 'Fecha' },
              { key: 'metodo_pago', label: 'Método' }
            ]}
            data={pagosData.data}
            loading={pagosData.loading}
          />
        )

      case 'miembros':
        return (
          <ReportTable
            columns={[
              { key: 'nombre_completo', label: 'Nombre' },
              { key: 'email', label: 'Email' },
              { key: 'votos_activos', label: 'Votos Activos' },
              { key: 'total_comprometido', label: 'Comprometido', format: (v) => `$${Number(v).toLocaleString()}` },
              { key: 'total_pagado', label: 'Pagado', format: (v) => `$${Number(v).toLocaleString()}` },
              { key: 'total_pendiente', label: 'Pendiente', format: (v) => `$${Number(v).toLocaleString()}` }
            ]}
            data={miembrosData.data}
            loading={miembrosData.loading}
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
          resultado = pdfModule.generarPDFVotos(votosData.data)
          break

        case 'ventas':
          if (ventasData.datos.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = pdfModule.generarPDFVentas(ventasData.datos)
          break

        case 'pagos':
          if (pagosData.data.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = pdfModule.generarPDFPagos(pagosData.data)
          break

        case 'miembros':
          if (miembrosData.data.length === 0) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = pdfModule.generarPDFMiembros(miembrosData.data)
          break

        case 'financiero':
          if (!financieroData.data) {
            showError('No hay datos para exportar', 4000)
            return
          }
          resultado = pdfModule.generarPDFFinanciero(financieroData.data)
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
