import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

interface ExcelColumn {
  header: string
  key: string
  width?: number
}

interface ExcelOptions {
  nombreArchivo: string
  nombreHoja?: string
  columnas: ExcelColumn[]
  datos: any[]
  incluirResumen?: boolean
}

export const exportarExcel = ({ nombreArchivo, nombreHoja = 'Datos', columnas, datos, incluirResumen = false }: ExcelOptions) => {
  try {
    // Crear workbook
    const wb = XLSX.utils.book_new()

    // Preparar datos para la hoja
    const headers = columnas.map(col => col.header)
    const rows = datos.map(row => 
      columnas.map(col => {
        const value = row[col.key]
        // Formatear números como moneda si es necesario
        if (typeof value === 'number' && (
          col.key.includes('monto') || 
          col.key.includes('total') || 
          col.key.includes('pagado') || 
          col.key.includes('pendiente') ||
          col.key.includes('comprometido')
        )) {
          return value // Excel manejará el formato numérico
        }
        return value || '-'
      })
    )

    // Crear hoja con headers y datos
    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Configurar anchos de columna
    const colWidths = columnas.map(col => ({
      wch: col.width || 15
    }))
    ws['!cols'] = colWidths

    // Aplicar estilos a los headers (primera fila)
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
      if (!ws[cellAddress]) continue
      
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '3B82F6' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      }
    }

    // Agregar resumen si se solicita
    if (incluirResumen && datos.length > 0) {
      const resumenRow = range.e.r + 2 // Dejar una fila en blanco
      
      // Agregar título de resumen
      const resumenTitleCell = XLSX.utils.encode_cell({ r: resumenRow, c: 0 })
      ws[resumenTitleCell] = { 
        v: 'RESUMEN', 
        t: 's',
        s: {
          font: { bold: true, sz: 14 },
          alignment: { horizontal: 'left' }
        }
      }

      // Calcular totales para columnas numéricas
      let rowOffset = 1
      columnas.forEach((col, index) => {
        const isNumeric = col.key.includes('monto') || 
                         col.key.includes('total') || 
                         col.key.includes('pagado') || 
                         col.key.includes('pendiente') ||
                         col.key.includes('comprometido')
        
        if (isNumeric) {
          const total = datos.reduce((sum, row) => sum + (Number(row[col.key]) || 0), 0)
          
          const labelCell = XLSX.utils.encode_cell({ r: resumenRow + rowOffset, c: 0 })
          const valueCell = XLSX.utils.encode_cell({ r: resumenRow + rowOffset, c: 1 })
          
          ws[labelCell] = { v: `Total ${col.header}:`, t: 's' }
          ws[valueCell] = { v: total, t: 'n', z: '$#,##0.00' }
          
          rowOffset++
        }
      })

      // Agregar total de registros
      const countLabelCell = XLSX.utils.encode_cell({ r: resumenRow + rowOffset, c: 0 })
      const countValueCell = XLSX.utils.encode_cell({ r: resumenRow + rowOffset, c: 1 })
      
      ws[countLabelCell] = { v: 'Total de registros:', t: 's' }
      ws[countValueCell] = { v: datos.length, t: 'n' }

      // Actualizar el rango de la hoja
      ws['!ref'] = XLSX.utils.encode_range({
        s: { r: 0, c: 0 },
        e: { r: resumenRow + rowOffset, c: range.e.c }
      })
    }

    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja)

    // Generar buffer y descargar
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, `${nombreArchivo}_${new Date().getTime()}.xlsx`)

    return { success: true, mensaje: 'Excel generado exitosamente' }
  } catch (error) {
    console.error('Error al generar Excel:', error)
    return { success: false, mensaje: 'Error al generar el Excel' }
  }
}

// Función específica para reporte de votos
export const exportarExcelVotos = (datos: any[]) => {
  return exportarExcel({
    nombreArchivo: 'Reporte_Votos',
    nombreHoja: 'Votos',
    columnas: [
      { header: 'Miembro', key: 'miembro_nombre', width: 25 },
      { header: 'Email', key: 'miembro_email', width: 30 },
      { header: 'Propósito', key: 'proposito', width: 30 },
      { header: 'Monto Total', key: 'monto_total', width: 15 },
      { header: 'Recaudado', key: 'recaudado', width: 15 },
      { header: 'Pendiente', key: 'pendiente', width: 15 },
      { header: 'Estado', key: 'estado', width: 12 },
      { header: 'Fecha Límite', key: 'fecha_limite', width: 15 }
    ],
    datos,
    incluirResumen: true
  })
}

// Función específica para reporte de pagos
export const exportarExcelPagos = (datos: any[]) => {
  return exportarExcel({
    nombreArchivo: 'Historial_Pagos',
    nombreHoja: 'Pagos',
    columnas: [
      { header: 'Fecha de Pago', key: 'fecha_pago', width: 15 },
      { header: 'Miembro', key: 'miembro_nombre', width: 25 },
      { header: 'Email', key: 'miembro_email', width: 30 },
      { header: 'Propósito', key: 'voto_proposito', width: 30 },
      { header: 'Monto', key: 'monto', width: 15 },
      { header: 'Método de Pago', key: 'metodo_pago', width: 15 },
      { header: 'Nota', key: 'nota', width: 40 }
    ],
    datos,
    incluirResumen: true
  })
}

// Función específica para reporte de miembros
export const exportarExcelMiembros = (datos: any[]) => {
  return exportarExcel({
    nombreArchivo: 'Reporte_Miembros',
    nombreHoja: 'Miembros',
    columnas: [
      { header: 'Nombre Completo', key: 'nombre_completo', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Votos Activos', key: 'votos_activos', width: 12 },
      { header: 'Votos Completados', key: 'votos_completados', width: 15 },
      { header: 'Total Comprometido', key: 'total_comprometido', width: 18 },
      { header: 'Total Pagado', key: 'total_pagado', width: 15 },
      { header: 'Total Pendiente', key: 'total_pendiente', width: 15 },
      { header: 'Estado', key: 'estado', width: 12 }
    ],
    datos,
    incluirResumen: true
  })
}

// Función específica para reporte financiero
export const exportarExcelFinanciero = (datos: any) => {
  try {
    const wb = XLSX.utils.book_new()

    // Hoja 1: Resumen Financiero
    const resumenData = [
      ['REPORTE FINANCIERO CONSOLIDADO'],
      [''],
      ['Fecha de Generación:', new Date().toLocaleDateString('es-CO')],
      [''],
      ['MÉTRICAS PRINCIPALES'],
      ['Total Comprometido', datos.total_comprometido],
      ['Total Recaudado', datos.total_recaudado],
      ['Total Pendiente', datos.total_pendiente],
      ['Promedio por Miembro', datos.promedio_por_miembro],
      [''],
      ['ESTADO DE VOTOS'],
      ['Votos Activos', datos.votos_activos],
      ['Votos Completados', datos.votos_completados],
      ['Votos Vencidos', datos.votos_vencidos],
      [''],
      ['INFORMACIÓN ADICIONAL'],
      ['Total Miembros Activos', datos.total_miembros_activos]
    ]

    const ws = XLSX.utils.aoa_to_sheet(resumenData)

    // Configurar anchos de columna
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 }
    ]

    // Aplicar estilos al título
    ws['A1'].s = {
      font: { bold: true, sz: 16, color: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center' }
    }

    // Merge del título
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
    ]

    // Aplicar formato de moneda a las celdas numéricas
    const formatoMoneda = '$#,##0.00'
    ;['B6', 'B7', 'B8', 'B9'].forEach(cell => {
      if (ws[cell]) {
        ws[cell].z = formatoMoneda
      }
    })

    XLSX.utils.book_append_sheet(wb, ws, 'Resumen Financiero')

    // Generar y descargar
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, `Reporte_Financiero_${new Date().getTime()}.xlsx`)

    return { success: true, mensaje: 'Excel generado exitosamente' }
  } catch (error) {
    console.error('Error al generar Excel financiero:', error)
    return { success: false, mensaje: 'Error al generar el Excel' }
  }
}
