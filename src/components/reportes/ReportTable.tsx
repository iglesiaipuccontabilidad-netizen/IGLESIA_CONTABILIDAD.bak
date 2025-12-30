'use client'

import { useState } from 'react'
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react'

interface Column {
  key: string
  label: string
  format?: (value: any) => string
}

interface ReportTableProps {
  columns: Column[]
  data: any[]
  loading?: boolean
  itemsPerPage?: number
}

export default function ReportTable({ columns, data, loading = false, itemsPerPage = 10 }: ReportTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-slate-200 rounded"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-100 rounded"></div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex p-4 bg-slate-100 rounded-full mb-4">
          <FileText className="h-12 w-12 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          No hay datos disponibles
        </h3>
        <p className="text-sm text-slate-600">
          Ajusta los filtros para ver resultados
        </p>
      </div>
    )
  }

  // Calcular paginación
  const totalPages = Math.ceil(data.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentData = data.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="overflow-x-auto">
      {/* Vista de tabla para desktop */}
      <div className="hidden md:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {currentData.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                {columns.map((column) => (
                  <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {column.format ? column.format(row[column.key]) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista de tarjetas para móvil */}
      <div className="md:hidden space-y-4">
        {currentData.map((row, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-lg p-4">
            {columns.map((column) => (
              <div key={column.key} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="text-sm font-medium text-slate-600">{column.label}:</span>
                <span className="text-sm text-slate-900">
                  {column.format ? column.format(row[column.key]) : row[column.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Controles de paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-slate-600">
            Mostrando {startIndex + 1} a {Math.min(endIndex, data.length)} de {data.length} resultados
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                if (pageNum > totalPages) return null

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    } transition-colors`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
