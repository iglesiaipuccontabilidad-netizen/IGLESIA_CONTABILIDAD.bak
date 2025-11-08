'use client'

import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ReportActionsProps {
  onExportPDF: () => Promise<void>
  onExportExcel: () => Promise<void>
  disabled?: boolean
}

export default function ReportActions({ onExportPDF, onExportExcel, disabled = false }: ReportActionsProps) {
  const [loadingPDF, setLoadingPDF] = useState(false)
  const [loadingExcel, setLoadingExcel] = useState(false)

  const handleExportPDF = async () => {
    try {
      setLoadingPDF(true)
      await onExportPDF()
    } catch (error) {
      console.error('Error al exportar PDF:', error)
    } finally {
      setLoadingPDF(false)
    }
  }

  const handleExportExcel = async () => {
    try {
      setLoadingExcel(true)
      await onExportExcel()
    } catch (error) {
      console.error('Error al exportar Excel:', error)
    } finally {
      setLoadingExcel(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {/* Botón PDF */}
      <button
        onClick={handleExportPDF}
        disabled={disabled || loadingPDF}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
      >
        {loadingPDF ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {loadingPDF ? 'Generando...' : 'Exportar PDF'}
        </span>
      </button>

      {/* Botón Excel */}
      <button
        onClick={handleExportExcel}
        disabled={disabled || loadingExcel}
        className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
      >
        {loadingExcel ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {loadingExcel ? 'Generando...' : 'Exportar Excel'}
        </span>
      </button>
    </div>
  )
}
