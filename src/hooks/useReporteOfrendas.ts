'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'

interface UseReporteOfrendasOptions {
  comiteId: string
  comiteNombre: string
}

export function useReporteOfrendas({
  comiteId,
  comiteNombre,
}: UseReporteOfrendasOptions) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generarPDF = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reportes/ofrendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comiteId,
          formato: 'pdf',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al generar PDF')
      }

      // Crear blob y descargar
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte-ofrendas-${comiteNombre.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('PDF generado y descargado correctamente')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(`Error: ${message}`)
      console.error('Error generando PDF:', err)
    } finally {
      setLoading(false)
    }
  }

  const generarExcel = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reportes/ofrendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          comiteId,
          formato: 'excel',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al generar Excel')
      }

      const data = await response.json()

      // Usar xlsx si está disponible
      try {
        const XLSX = await import('xlsx').then(m => m)

        // Preparar datos para Excel
        const wsData = [
          ['REPORTE DE OFRENDAS'],
          [`Comité: ${data.comite}`],
          [`Fecha: ${new Date().toLocaleDateString('es-CO')}`],
          [],
          ['ESTADÍSTICAS GENERALES'],
          ['Total de Ofrendas', data.totalOfrendas],
          ['Monto Total', `$${data.montoTotal.toLocaleString('es-CO')}`],
          [],
          ['DETALLE DE OFRENDAS'],
          ['Fecha', 'Tipo', 'Monto', 'Concepto', 'Proyecto'],
          ...data.ofrendas.map((o: any) => [
            new Date(o.fecha).toLocaleDateString('es-CO'),
            o.tipo,
            o.monto,
            o.concepto || '-',
            o.proyecto_nombre || '-',
          ]),
        ]

        const ws = XLSX.utils.aoa_to_sheet(wsData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Ofrendas')

        XLSX.writeFile(
          wb,
          `reporte-ofrendas-${comiteNombre.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`
        )

        toast.success('Excel generado y descargado correctamente')
      } catch (xlsxError) {
        // Fallback a CSV si xlsx no está disponible
        generarCSV(data)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      toast.error(`Error: ${message}`)
      console.error('Error generando Excel:', err)
    } finally {
      setLoading(false)
    }
  }

  const generarCSV = (data: any) => {
    const headers = ['Fecha', 'Tipo', 'Monto', 'Concepto', 'Proyecto']
    const rows = data.ofrendas.map((o: any) => [
      new Date(o.fecha).toLocaleDateString('es-CO'),
      o.tipo,
      o.monto,
      o.concepto || '-',
      o.proyecto_nombre || '-',
    ])

    const csv = [
      `REPORTE DE OFRENDAS,`,
      `Comité: ${data.comite},`,
      `Fecha: ${new Date().toLocaleDateString('es-CO')},`,
      ``,
      `ESTADÍSTICAS GENERALES,`,
      `Total de Ofrendas,${data.totalOfrendas}`,
      `Monto Total,$${data.montoTotal}`,
      ``,
      headers.join(','),
      ...rows.map((r: any[]) => r.join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `reporte-ofrendas-${comiteNombre.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success('CSV generado y descargado correctamente')
  }

  return {
    generarPDF,
    generarExcel,
    loading,
    error,
  }
}
