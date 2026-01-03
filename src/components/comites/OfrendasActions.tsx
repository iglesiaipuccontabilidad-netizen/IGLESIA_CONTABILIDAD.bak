'use client'

import { FileText, Download, Sheet, Loader } from 'lucide-react'
import { useState } from 'react'
import { useReporteOfrendas } from '@/hooks/useReporteOfrendas'

interface OfrendasActionsProps {
  ofrendas: any[]
  comiteNombre: string
  comiteId: string
}

export function OfrendasActions({
  ofrendas,
  comiteNombre,
  comiteId,
}: OfrendasActionsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const { generarPDF, generarExcel, loading } = useReporteOfrendas({
    comiteId,
    comiteNombre,
  })

  const handleGenerarPDF = async () => {
    await generarPDF()
    setShowMenu(false)
  }

  const handleGenerarExcel = async () => {
    await generarExcel()
    setShowMenu(false)
  }

  return (
    <div className="relative inline-block w-auto">
      {/* Botón Principal */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="group relative inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {loading ? (
          <>
            <Loader className="w-5 h-5 relative z-10 animate-spin" />
            <span className="relative z-10">Generando...</span>
          </>
        ) : (
          <>
            <FileText className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Generar Reporte</span>
          </>
        )}
      </button>

      {/* Menú Desplegable */}
      {showMenu && !loading && (
        <div className="absolute top-full mt-2 -right-2 md:right-0 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-[999] w-60 md:w-auto md:min-w-56">
          {/* Opción PDF */}
          <button
            onClick={handleGenerarPDF}
            disabled={loading || ofrendas.length === 0}
            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-b border-gray-100"
          >
            <div className="bg-red-100 p-2 rounded-lg flex-shrink-0">
              <FileText className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm">Descargar PDF</div>
              <div className="text-xs text-gray-500">Reporte profesional</div>
            </div>
            <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>

          {/* Opción Excel */}
          <button
            onClick={handleGenerarExcel}
            disabled={loading || ofrendas.length === 0}
            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
              <Sheet className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm">Descargar Excel</div>
              <div className="text-xs text-gray-500">Datos tabulares</div>
            </div>
            <Download className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>

          {/* Separador */}
          <div className="border-t border-gray-100 px-4 py-2">
            <div className="text-xs text-gray-500">
              {ofrendas.length} registros disponibles
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar menú */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[998]"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  )
}
