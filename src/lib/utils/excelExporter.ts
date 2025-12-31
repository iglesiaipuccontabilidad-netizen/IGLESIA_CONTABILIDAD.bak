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

// Función específica para reporte avanzado de miembros
export const exportarExcelMiembros = (datos: any[]) => {
  try {
    const wb = XLSX.utils.book_new()

    // Calcular métricas avanzadas
    const totalMiembros = datos.length
    const miembrosActivos = datos.filter(m => m.estado === 'activo').length
    const totalComprometido = datos.reduce((sum, m) => sum + (m.total_comprometido || 0), 0)
    const totalPagado = datos.reduce((sum, m) => sum + (m.total_pagado || 0), 0)
    const totalPendiente = totalComprometido - totalPagado
    const promedioComprometido = totalMiembros > 0 ? totalComprometido / totalMiembros : 0
    const promedioPagado = totalMiembros > 0 ? totalPagado / totalMiembros : 0
    const porcentajeCumplimiento = totalComprometido > 0 ? (totalPagado / totalComprometido) * 100 : 0

    // Top contribuyentes
    const topContribuyentes = [...datos]
      .sort((a, b) => (b.total_comprometido || 0) - (a.total_comprometido || 0))
      .slice(0, 10)

    // ============ HOJA 1: RESUMEN EJECUTIVO ============
    const resumenEjecutivo = [
      ['REPORTE DE MIEMBROS - RESUMEN EJECUTIVO'],
      ['Fecha de Generacion:', new Date().toLocaleDateString('es-CO')],
      [''],
      ['INDICADORES CLAVE DE DESEMPEÑO (KPI)'],
      ['Metrica', 'Valor', 'Unidad'],
      ['Total Miembros', totalMiembros, 'personas'],
      ['Miembros Activos', miembrosActivos, 'personas'],
      ['Total Comprometido', totalComprometido, 'COP'],
      ['Total Recaudado', totalPagado, 'COP'],
      ['Total Pendiente', totalPendiente, 'COP'],
      ['Porcentaje Cumplimiento', porcentajeCumplimiento, '%'],
      [''],
      ['METRICAS OPERATIVAS'],
      ['Metricas', 'Valor', 'Unidad'],
      ['Promedio Comprometido', promedioComprometido, 'COP'],
      ['Promedio Recaudado', promedioPagado, 'COP'],
      ['Miembros con Deuda', datos.filter(m => (m.total_pendiente || 0) > 0).length, 'personas'],
      ['Miembros al Día', datos.filter(m => (m.total_pendiente || 0) === 0).length, 'personas']
    ]

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenEjecutivo)
    wsResumen['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }]

    // Estilos para titulo
    wsResumen['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
    wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]

    // Estilos para headers de secciones
    ;['A4', 'A13'].forEach(cell => {
      wsResumen[cell].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F2937' } }
      }
    })

    // Aplicar formato moneda y porcentaje
    for (let i = 5; i <= 10; i++) {
      if (wsResumen[`B${i}`]) {
        wsResumen[`B${i}`].z = i === 10 ? '0.0%' : '$#,##0'
      }
    }
    for (let i = 14; i <= 17; i++) {
      if (wsResumen[`B${i}`]) {
        wsResumen[`B${i}`].z = i === 17 ? 'personas' : '$#,##0'
      }
    }

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo')

    // ============ HOJA 2: TOP CONTRIBUYENTES ============
    if (topContribuyentes.length > 0) {
      const topContribuyentesData = [
        ['TOP 10 CONTRIBUYENTES'],
        ['Posicion', 'Nombre', 'Email', 'Comprometido', 'Recaudado', 'Pendiente', 'Cumplimiento %', 'Estado']
      ]

      topContribuyentes.forEach((miembro: any, index: number) => {
        const pendiente = miembro.total_comprometido - miembro.total_pagado
        const cumplimiento = miembro.total_comprometido > 0 ? (miembro.total_pagado / miembro.total_comprometido) * 100 : 0
        const estado = pendiente === 0 ? 'Completado' : pendiente > 0 ? 'Pendiente' : 'Excedente'

        topContribuyentesData.push([
          index + 1,
          miembro.nombre_completo,
          miembro.email,
          miembro.total_comprometido,
          miembro.total_pagado,
          pendiente,
          cumplimiento,
          estado
        ])
      })

      const wsTop = XLSX.utils.aoa_to_sheet(topContribuyentesData)
      wsTop['!cols'] = [
        { wch: 10 },
        { wch: 30 },
        { wch: 30 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 15 }
      ]

      // Header styling
      wsTop['A1'].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '059669' } }
      }
      wsTop['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]

      // Estilos para headers de columnas
      for (let col = 0; col < 8; col++) {
        const cellRef = XLSX.utils.encode_col(col) + '2'
        wsTop[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '10B981' } },
          alignment: { horizontal: 'center' }
        }
      }

      // Formato de moneda
      for (let i = 2; i < topContribuyentesData.length + 1; i++) {
        ;['D', 'E', 'F'].forEach(col => {
          const cell = `${col}${i + 1}`
          if (wsTop[cell]) wsTop[cell].z = '$#,##0'
        })
        const percentCell = `G${i + 1}`
        if (wsTop[percentCell]) wsTop[percentCell].z = '0.0%'
      }

      XLSX.utils.book_append_sheet(wb, wsTop, 'Top Contribuyentes')
    }

    // ============ HOJA 3: LISTA DETALLADA ============
    const listaDetallada = [
      ['LISTA DETALLADA DE MIEMBROS'],
      ['Nombre Completo', 'Email', 'Telefono', 'Votos Activos', 'Votos Completados', 'Total Comprometido', 'Total Pagado', 'Total Pendiente', 'Estado']
    ]

    datos.forEach((miembro: any) => {
      listaDetallada.push([
        miembro.nombre_completo,
        miembro.email,
        miembro.telefono || '',
        miembro.votos_activos || 0,
        miembro.votos_completados || 0,
        miembro.total_comprometido || 0,
        miembro.total_pagado || 0,
        miembro.total_pendiente || 0,
        miembro.estado || 'activo'
      ])
    })

    const wsLista = XLSX.utils.aoa_to_sheet(listaDetallada)
    wsLista['!cols'] = [
      { wch: 30 },
      { wch: 30 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 }
    ]

    // Header styling
    wsLista['A1'].s = {
      font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2563EB' } }
    }
    wsLista['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }]

    for (let col = 0; col < 9; col++) {
      const cellRef = XLSX.utils.encode_col(col) + '2'
      wsLista[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '3B82F6' } },
        alignment: { horizontal: 'center' }
      }
    }

    // Formato de moneda
    for (let i = 2; i < listaDetallada.length + 1; i++) {
      ;['F', 'G', 'H'].forEach(col => {
        const cell = `${col}${i + 1}`
        if (wsLista[cell]) wsLista[cell].z = '$#,##0'
      })
    }

    XLSX.utils.book_append_sheet(wb, wsLista, 'Lista Detallada')

    // ============ HOJA 4: ESTADO Y DEUDAS ============
    const estadoDeudas = [
      ['ANALISIS DE ESTADO Y DEUDAS'],
      [''],
      ['RESUMEN POR ESTADO'],
      ['Estado', 'Cantidad', 'Porcentaje', 'Comprometido', 'Recaudado', 'Pendiente']
    ]

    const estados = ['activo', 'inactivo']
    estados.forEach(estado => {
      const miembrosEstado = datos.filter(m => m.estado === estado)
      const count = miembrosEstado.length
      const comprometido = miembrosEstado.reduce((sum, m) => sum + (m.total_comprometido || 0), 0)
      const recaudado = miembrosEstado.reduce((sum, m) => sum + (m.total_pagado || 0), 0)
      const pendiente = comprometido - recaudado

      estadoDeudas.push([
        estado.charAt(0).toUpperCase() + estado.slice(1),
        count,
        totalMiembros > 0 ? count / totalMiembros : 0,
        comprometido,
        recaudado,
        pendiente
      ])
    })

    estadoDeudas.push([''], ['ANALISIS DE DEUDAS'], ['Categoria', 'Cantidad', 'Porcentaje', 'Monto Total'])

    // Categorías de deuda
    const sinDeuda = datos.filter(m => (m.total_pendiente || 0) === 0).length
    const conDeuda = datos.filter(m => (m.total_pendiente || 0) > 0).length
    const deudaMenor500k = datos.filter(m => (m.total_pendiente || 0) > 0 && (m.total_pendiente || 0) < 500000).length
    const deudaMayor500k = datos.filter(m => (m.total_pendiente || 0) >= 500000).length

    estadoDeudas.push(
      ['Sin Deuda', sinDeuda.toString(), totalMiembros > 0 ? (sinDeuda / totalMiembros).toString() : '0', '0'],
      ['Con Deuda', conDeuda.toString(), totalMiembros > 0 ? (conDeuda / totalMiembros).toString() : '0', totalPendiente.toString()],
      ['Deuda < $500K', deudaMenor500k.toString(), totalMiembros > 0 ? (deudaMenor500k / totalMiembros).toString() : '0', 
       datos.filter(m => (m.total_pendiente || 0) > 0 && (m.total_pendiente || 0) < 500000)
            .reduce((sum, m) => sum + (m.total_pendiente || 0), 0).toString()],
      ['Deuda >= $500K', deudaMayor500k.toString(), totalMiembros > 0 ? (deudaMayor500k / totalMiembros).toString() : '0',
       datos.filter(m => (m.total_pendiente || 0) >= 500000)
            .reduce((sum, m) => sum + (m.total_pendiente || 0), 0).toString()]
    )

    const wsEstado = XLSX.utils.aoa_to_sheet(estadoDeudas)
    wsEstado['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }]

    wsEstado['A1'].s = {
      font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '7C3AED' } }
    }
    wsEstado['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]

    // Estilos para subtitulos
    ;['A3', 'A11'].forEach(cell => {
      wsEstado[cell].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'A78BFA' } }
      }
    })

    // Headers
    ;['A4', 'A12'].forEach(cell => {
      const row = parseInt(cell.substring(1))
      for (let col = 0; col < 6; col++) {
        const cellRef = XLSX.utils.encode_col(col) + row
        wsEstado[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: 'A78BFA' } }
        }
      }
    })

    // Formato de porcentajes y monedas
    for (let i = 5; i <= 6; i++) {
      wsEstado[`C${i}`].z = '0.0%'
      ;['D', 'E', 'F'].forEach(col => {
        const cell = `${col}${i}`
        if (wsEstado[cell]) wsEstado[cell].z = '$#,##0'
      })
    }
    for (let i = 13; i <= 16; i++) {
      wsEstado[`C${i}`].z = '0.0%'
      const cellD = `D${i}`
      if (wsEstado[cellD]) wsEstado[cellD].z = '$#,##0'
    }

    XLSX.utils.book_append_sheet(wb, wsEstado, 'Estado y Deudas')

    // Generar y descargar
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, `Reporte_Miembros_Avanzado_${new Date().getTime()}.xlsx`)

    return { success: true, mensaje: 'Excel avanzado de miembros generado con 4 hojas de analisis completo' }
  } catch (error) {
    console.error('Error al generar Excel de miembros:', error)
    return { success: false, mensaje: 'Error al generar el Excel' }
  }
}

// Función específica para reporte financiero
export const exportarExcelFinanciero = (datos: any) => {
  try {
    const wb = XLSX.utils.book_new()

    // ============ HOJA 1: RESUMEN EJECUTIVO ============
    const resumenEjecutivo = [
      ['REPORTE FINANCIERO CONSOLIDADO - RESUMEN EJECUTIVO'],
      ['Fecha de Generacion:', new Date().toLocaleDateString('es-CO')],
      [''],
      ['INDICADORES CLAVE DE DESEMPEÑO (KPI)'],
      ['Metrica', 'Valor', 'Unidad'],
      ['Total Comprometido', datos.total_comprometido, 'COP'],
      ['Total Recaudado', datos.total_recaudado, 'COP'],
      ['Total Pendiente', datos.total_pendiente, 'COP'],
      ['Porcentaje de Cumplimiento', datos.porcentaje_cumplimiento, '%'],
      ['Eficiencia de Recaudacion', datos.eficiencia_recaudacion, '%'],
      ['Tasa de Vencimiento', datos.tasa_vencimiento, '%'],
      [''],
      ['METRICAS OPERATIVAS'],
      ['Metricas', 'Valor', 'Unidad'],
      ['Miembros Activos', datos.total_miembros_activos, 'personas'],
      ['Total de Votos', datos.total_votos, 'votos'],
      ['Promedio por Miembro', datos.promedio_por_miembro, 'COP'],
      ['Promedio por Voto', datos.promedio_por_voto, 'COP'],
      ['Crecimiento Mensual', datos.crecimiento_mensual, '%'],
      [''],
      ['ANALISIS DE TENDENCIAS'],
      ['Periodo', 'Valor', 'Unidad'],
      ['Recaudacion Mes Actual', datos.recaudacion_mes_actual, 'COP'],
      ['Recaudacion Mes Anterior', datos.recaudacion_mes_anterior, 'COP'],
      ['Variacion Mensual', datos.variacion_mensual, '%']
    ]

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenEjecutivo)
    wsResumen['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }]

    // Estilos para titulo
    wsResumen['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
    wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]

    // Estilos para headers de secciones
    ;['A4', 'A13', 'A21'].forEach(cell => {
      wsResumen[cell].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F2937' } }
      }
    })

    // Aplicar formato moneda y porcentaje
    for (let i = 5; i <= 10; i++) {
      if (wsResumen[`B${i}`]) {
        wsResumen[`B${i}`].z = '$#,##0'
      }
    }
    for (let i = 14; i <= 19; i++) {
      if (wsResumen[`B${i}`]) {
        wsResumen[`B${i}`].z = '$#,##0'
      }
    }
    for (let i = 22; i <= 24; i++) {
      if (wsResumen[`B${i}`]) {
        wsResumen[`B${i}`].z = '$#,##0'
      }
    }

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo')

    // ============ HOJA 2: TOP CONTRIBUYENTES ============
    if (datos.top_miembros && datos.top_miembros.length > 0) {
      const topContribuyentes = [
        ['TOP 10 CONTRIBUYENTES'],
        ['Posicion', 'Nombre', 'Comprometido', 'Recaudado', 'Pendiente', 'Cumplimiento %', 'Estado']
      ]

      datos.top_miembros.forEach((miembro: any, index: number) => {
        const pendiente = miembro.total_comprometido - miembro.total_recaudado
        const estado = pendiente === 0 ? 'Completado' : pendiente > 0 ? 'Pendiente' : 'Excedente'

        topContribuyentes.push([
          index + 1,
          miembro.nombre,
          miembro.total_comprometido,
          miembro.total_recaudado,
          pendiente,
          miembro.porcentaje_cumplimiento,
          estado
        ])
      })

      const wsTop = XLSX.utils.aoa_to_sheet(topContribuyentes)
      wsTop['!cols'] = [
        { wch: 10 },
        { wch: 30 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 15 }
      ]

      // Header styling
      wsTop['A1'].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '059669' } }
      }
      wsTop['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]

      // Estilos para headers de columnas
      for (let col = 0; col < 7; col++) {
        const cellRef = XLSX.utils.encode_col(col) + '2'
        wsTop[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '10B981' } },
          alignment: { horizontal: 'center' }
        }
      }

      // Formato de moneda
      for (let i = 2; i < topContribuyentes.length + 1; i++) {
        ;['C', 'D', 'E'].forEach(col => {
          const cell = `${col}${i + 1}`
          if (wsTop[cell]) wsTop[cell].z = '$#,##0'
        })
        const percentCell = `F${i + 1}`
        if (wsTop[percentCell]) wsTop[percentCell].z = '0.0%'
      }

      XLSX.utils.book_append_sheet(wb, wsTop, 'Top Contribuyentes')
    }

    // ============ HOJA 3: ANALISIS POR PROPOSITOS ============
    if (datos.analisis_propositos && datos.analisis_propositos.length > 0) {
      const analisisPropositos = [
        ['ANALISIS POR PROPOSITOS'],
        ['Proposito', 'Votos', 'Comprometido', 'Recaudado', 'Pendiente', 'Avance %', 'Estado']
      ]

      datos.analisis_propositos.forEach((proposito: any) => {
        const pendiente = proposito.total_comprometido - proposito.total_recaudado
        const estado = proposito.porcentaje_avance >= 100 ? 'Completado' :
                      proposito.porcentaje_avance >= 75 ? 'Avanzado' :
                      proposito.porcentaje_avance >= 50 ? 'En Progreso' :
                      proposito.porcentaje_avance >= 25 ? 'Iniciado' : 'Pendiente'

        analisisPropositos.push([
          proposito.nombre,
          proposito.votos_count,
          proposito.total_comprometido,
          proposito.total_recaudado,
          pendiente,
          proposito.porcentaje_avance,
          estado
        ])
      })

      const wsPropositos = XLSX.utils.aoa_to_sheet(analisisPropositos)
      wsPropositos['!cols'] = [
        { wch: 30 },
        { wch: 10 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 15 }
      ]

      // Header styling
      wsPropositos['A1'].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2563EB' } }
      }
      wsPropositos['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]

      for (let col = 0; col < 7; col++) {
        const cellRef = XLSX.utils.encode_col(col) + '2'
        wsPropositos[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '3B82F6' } },
          alignment: { horizontal: 'center' }
        }
      }

      for (let i = 2; i < analisisPropositos.length + 1; i++) {
        ;['C', 'D', 'E'].forEach(col => {
          const cell = `${col}${i + 1}`
          if (wsPropositos[cell]) wsPropositos[cell].z = '$#,##0'
        })
        const percentCell = `F${i + 1}`
        if (wsPropositos[percentCell]) wsPropositos[percentCell].z = '0.0%'
      }

      XLSX.utils.book_append_sheet(wb, wsPropositos, 'Analisis Propositos')
    }

    // ============ HOJA 4: TENDENCIAS MENSUALES ============
    if (datos.tendencia_recaudacion && datos.tendencia_recaudacion.length > 0) {
      const tendenciasData = [
        ['TENDENCIAS DE RECAUDACION MENSUAL'],
        ['Mes', 'Ano', 'Comprometido', 'Recaudado', 'Pendiente', 'Cumplimiento %']
      ]

      datos.tendencia_recaudacion.forEach((tendencia: any) => {
        const pendiente = tendencia.comprometido - tendencia.recaudado
        const cumplimiento = tendencia.comprometido > 0 ? (tendencia.recaudado / tendencia.comprometido) * 100 : 0

        tendenciasData.push([
          tendencia.mes,
          tendencia.year,
          tendencia.comprometido,
          tendencia.recaudado,
          pendiente,
          cumplimiento
        ])
      })

      const wsTendencias = XLSX.utils.aoa_to_sheet(tendenciasData)
      wsTendencias['!cols'] = [
        { wch: 15 },
        { wch: 8 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 }
      ]

      wsTendencias['A1'].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'D97706' } }
      }
      wsTendencias['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]

      for (let col = 0; col < 6; col++) {
        const cellRef = XLSX.utils.encode_col(col) + '2'
        wsTendencias[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: 'F59E0B' } },
          alignment: { horizontal: 'center' }
        }
      }

      for (let i = 2; i < tendenciasData.length + 1; i++) {
        ;['C', 'D', 'E'].forEach(col => {
          const cell = `${col}${i + 1}`
          if (wsTendencias[cell]) wsTendencias[cell].z = '$#,##0'
        })
        const percentCell = `F${i + 1}`
        if (wsTendencias[percentCell]) wsTendencias[percentCell].z = '0.0%'
      }

      XLSX.utils.book_append_sheet(wb, wsTendencias, 'Tendencias Mensuales')
    }

    // ============ HOJA 5: DISTRIBUCION Y ESTADO ============
    const distribucionData = [
      ['DISTRIBUCION DE VOTOS Y ESTADO'],
      [''],
      ['DISTRIBUCION POR RANGO'],
      ['Rango', 'Cantidad', 'Porcentaje'],
      ['Pequenos (< $500K)', datos.votos_pequenos, datos.total_votos > 0 ? datos.votos_pequenos / datos.total_votos : 0],
      ['Medianos ($500K - $2M)', datos.votos_medianos, datos.total_votos > 0 ? datos.votos_medianos / datos.total_votos : 0],
      ['Grandes (> $2M)', datos.votos_grandes, datos.total_votos > 0 ? datos.votos_grandes / datos.total_votos : 0],
      [''],
      ['ESTADO DE VOTOS'],
      ['Estado', 'Cantidad', 'Porcentaje'],
      ['Activos', datos.votos_activos, datos.total_votos > 0 ? datos.votos_activos / datos.total_votos : 0],
      ['Completados', datos.votos_completados, datos.total_votos > 0 ? datos.votos_completados / datos.total_votos : 0],
      ['Vencidos', datos.votos_vencidos, datos.total_votos > 0 ? datos.votos_vencidos / datos.total_votos : 0]
    ]

    const wsDistribucion = XLSX.utils.aoa_to_sheet(distribucionData)
    wsDistribucion['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }]

    wsDistribucion['A1'].s = {
      font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '7C3AED' } }
    }
    wsDistribucion['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]

    // Estilos para subtitulos
    ;['A3', 'A9'].forEach(cell => {
      wsDistribucion[cell].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'A78BFA' } }
      }
    })

    // Headers
    ;['A4', 'A10'].forEach(cell => {
      const row = parseInt(cell.substring(1))
      for (let col = 0; col < 3; col++) {
        const cellRef = XLSX.utils.encode_col(col) + row
        wsDistribucion[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: 'A78BFA' } }
        }
      }
    })

    for (let i = 5; i <= 7; i++) {
      wsDistribucion[`C${i}`].z = '0.0%'
    }
    for (let i = 11; i <= 13; i++) {
      wsDistribucion[`C${i}`].z = '0.0%'
    }

    XLSX.utils.book_append_sheet(wb, wsDistribucion, 'Distribucion y Estado')

    // Generar y descargar
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, `Reporte_Financiero_Avanzado_${new Date().getTime()}.xlsx`)

    return { success: true, mensaje: 'Excel avanzado generado con 5 hojas de analisis completo' }
  } catch (error) {
    console.error('Error al generar Excel financiero:', error)
    return { success: false, mensaje: 'Error al generar el Excel' }
  }
}

// Función específica para reporte avanzado de votos
export const exportarExcelVotos = (datos: any[]) => {
  try {
    const wb = XLSX.utils.book_new()

    // Calcular métricas avanzadas
    const totalVotos = datos.length
    const votosActivos = datos.filter(v => v.estado === 'activo').length
    const votosCompletados = datos.filter(v => v.estado === 'completado').length
    const votosVencidos = datos.filter(v => v.estado === 'vencido').length
    const totalComprometido = datos.reduce((sum, v) => sum + (v.monto_total || 0), 0)
    const totalRecaudado = datos.reduce((sum, v) => sum + (v.recaudado || 0), 0)
    const totalPendiente = totalComprometido - totalRecaudado
    const promedioVoto = totalVotos > 0 ? totalComprometido / totalVotos : 0
    const porcentajeCumplimiento = totalComprometido > 0 ? (totalRecaudado / totalComprometido) * 100 : 0

    // Agrupar por propósito
    const propositosMap = new Map()
    datos.forEach(voto => {
      const prop = voto.proposito || 'Sin propósito'
      if (!propositosMap.has(prop)) {
        propositosMap.set(prop, { count: 0, comprometido: 0, recaudado: 0 })
      }
      const data = propositosMap.get(prop)
      data.count++
      data.comprometido += voto.monto_total || 0
      data.recaudado += voto.recaudado || 0
    })
    const analisisPropositos = Array.from(propositosMap.entries()).map(([nombre, data]) => ({
      nombre,
      votos_count: data.count,
      total_comprometido: data.comprometido,
      total_recaudado: data.recaudado,
      porcentaje_avance: data.comprometido > 0 ? (data.recaudado / data.comprometido) * 100 : 0
    })).sort((a, b) => b.total_comprometido - a.total_comprometido)

    // ============ HOJA 1: RESUMEN EJECUTIVO ============
    const resumenEjecutivo = [
      ['REPORTE DE VOTOS - RESUMEN EJECUTIVO'],
      ['Fecha de Generacion:', new Date().toLocaleDateString('es-CO')],
      [''],
      ['INDICADORES CLAVE DE DESEMPEÑO (KPI)'],
      ['Metrica', 'Valor', 'Unidad'],
      ['Total de Votos', totalVotos, 'votos'],
      ['Votos Activos', votosActivos, 'votos'],
      ['Votos Completados', votosCompletados, 'votos'],
      ['Votos Vencidos', votosVencidos, 'votos'],
      ['Total Comprometido', totalComprometido, 'COP'],
      ['Total Recaudado', totalRecaudado, 'COP'],
      ['Total Pendiente', totalPendiente, 'COP'],
      ['Porcentaje Cumplimiento', porcentajeCumplimiento, '%'],
      [''],
      ['METRICAS OPERATIVAS'],
      ['Metricas', 'Valor', 'Unidad'],
      ['Promedio por Voto', promedioVoto, 'COP'],
      ['Propositos Diferentes', analisisPropositos.length, 'propositos']
    ]

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenEjecutivo)
    wsResumen['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 15 }]

    // Estilos para titulo
    wsResumen['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center', vertical: 'center' }
    }
    wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }]

    // Estilos para headers de secciones
    ;['A4', 'A15'].forEach(cell => {
      wsResumen[cell].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F2937' } }
      }
    })

    // Aplicar formato moneda y porcentaje
    for (let i = 5; i <= 12; i++) {
      if (wsResumen[`B${i}`]) {
        wsResumen[`B${i}`].z = i === 12 ? '0.0%' : (i >= 9 ? '$#,##0' : '0')
      }
    }
    for (let i = 16; i <= 17; i++) {
      if (wsResumen[`B${i}`]) {
        wsResumen[`B${i}`].z = i === 16 ? '$#,##0' : '0'
      }
    }

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo')

    // ============ HOJA 2: ANALISIS POR PROPOSITOS ============
    if (analisisPropositos.length > 0) {
      const analisisPropositosData = [
        ['ANALISIS POR PROPOSITOS'],
        ['Proposito', 'Votos', 'Comprometido', 'Recaudado', 'Pendiente', 'Avance %', 'Estado']
      ]

      analisisPropositos.forEach((proposito: any) => {
        const pendiente = proposito.total_comprometido - proposito.total_recaudado
        const estado = proposito.porcentaje_avance >= 100 ? 'Completado' :
                      proposito.porcentaje_avance >= 75 ? 'Avanzado' :
                      proposito.porcentaje_avance >= 50 ? 'En Progreso' :
                      proposito.porcentaje_avance >= 25 ? 'Iniciado' : 'Pendiente'

        analisisPropositosData.push([
          proposito.nombre,
          proposito.votos_count,
          proposito.total_comprometido,
          proposito.total_recaudado,
          pendiente,
          proposito.porcentaje_avance,
          estado
        ])
      })

      const wsPropositos = XLSX.utils.aoa_to_sheet(analisisPropositosData)
      wsPropositos['!cols'] = [
        { wch: 30 },
        { wch: 10 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 12 },
        { wch: 15 }
      ]

      // Header styling
      wsPropositos['A1'].s = {
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2563EB' } }
      }
      wsPropositos['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]

      for (let col = 0; col < 7; col++) {
        const cellRef = XLSX.utils.encode_col(col) + '2'
        wsPropositos[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '3B82F6' } },
          alignment: { horizontal: 'center' }
        }
      }

      for (let i = 2; i < analisisPropositosData.length + 1; i++) {
        ;['C', 'D', 'E'].forEach(col => {
          const cell = `${col}${i + 1}`
          if (wsPropositos[cell]) wsPropositos[cell].z = '$#,##0'
        })
        const percentCell = `F${i + 1}`
        if (wsPropositos[percentCell]) wsPropositos[percentCell].z = '0.0%'
      }

      XLSX.utils.book_append_sheet(wb, wsPropositos, 'Analisis Propositos')
    }

    // ============ HOJA 3: LISTA DETALLADA ============
    const listaDetallada = [
      ['LISTA DETALLADA DE VOTOS'],
      ['Proposito', 'Miembro', 'Email', 'Monto Total', 'Recaudado', 'Pendiente', 'Estado', 'Fecha Limite', 'Fecha Creacion']
    ]

    datos.forEach((voto: any) => {
      listaDetallada.push([
        voto.proposito || 'Sin propósito',
        voto.miembro_nombre,
        voto.miembro_email,
        voto.monto_total || 0,
        voto.recaudado || 0,
        voto.pendiente || 0,
        voto.estado || 'activo',
        voto.fecha_limite,
        voto.created_at
      ])
    })

    const wsLista = XLSX.utils.aoa_to_sheet(listaDetallada)
    wsLista['!cols'] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 15 },
      { wch: 15 }
    ]

    // Header styling
    wsLista['A1'].s = {
      font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2563EB' } }
    }
    wsLista['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }]

    for (let col = 0; col < 9; col++) {
      const cellRef = XLSX.utils.encode_col(col) + '2'
      wsLista[cellRef].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '3B82F6' } },
        alignment: { horizontal: 'center' }
      }
    }

    // Formato de moneda
    for (let i = 2; i < listaDetallada.length + 1; i++) {
      ;['D', 'E', 'F'].forEach(col => {
        const cell = `${col}${i + 1}`
        if (wsLista[cell]) wsLista[cell].z = '$#,##0'
      })
    }

    XLSX.utils.book_append_sheet(wb, wsLista, 'Lista Detallada')

    // ============ HOJA 4: ESTADO Y DISTRIBUCION ============
    const estadoDistribucion = [
      ['ANALISIS DE ESTADO Y DISTRIBUCION'],
      [''],
      ['DISTRIBUCION POR ESTADO'],
      ['Estado', 'Cantidad', 'Porcentaje', 'Comprometido', 'Recaudado', 'Pendiente']
    ]

    const estados = ['activo', 'completado', 'vencido']
    estados.forEach(estado => {
      const votosEstado = datos.filter(v => v.estado === estado)
      const count = votosEstado.length
      const comprometido = votosEstado.reduce((sum, v) => sum + (v.monto_total || 0), 0)
      const recaudado = votosEstado.reduce((sum, v) => sum + (v.recaudado || 0), 0)
      const pendiente = comprometido - recaudado

      estadoDistribucion.push([
        estado.charAt(0).toUpperCase() + estado.slice(1),
        count,
        totalVotos > 0 ? count / totalVotos : 0,
        comprometido,
        recaudado,
        pendiente
      ])
    })

    estadoDistribucion.push([''], ['DISTRIBUCION POR RANGO'], ['Rango', 'Cantidad', 'Porcentaje', 'Monto Total'])

    // Rangos de montos
    const rangos = [
      { label: 'Pequenos (< $500K)', min: 0, max: 500000 },
      { label: 'Medianos ($500K - $2M)', min: 500000, max: 2000000 },
      { label: 'Grandes (> $2M)', min: 2000000, max: Infinity }
    ]

    rangos.forEach(rango => {
      const votosRango = datos.filter(v => {
        const monto = v.monto_total || 0
        return monto >= rango.min && monto < rango.max
      })
      const count = votosRango.length
      const montoTotal = votosRango.reduce((sum, v) => sum + (v.monto_total || 0), 0)

      estadoDistribucion.push([
        rango.label,
        count,
        totalVotos > 0 ? count / totalVotos : 0,
        montoTotal
      ])
    })

    const wsEstado = XLSX.utils.aoa_to_sheet(estadoDistribucion)
    wsEstado['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }]

    wsEstado['A1'].s = {
      font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '7C3AED' } }
    }
    wsEstado['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }]

    // Estilos para subtitulos
    ;['A3', 'A11'].forEach(cell => {
      wsEstado[cell].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: 'A78BFA' } }
      }
    })

    // Headers
    ;['A4', 'A12'].forEach(cell => {
      const row = parseInt(cell.substring(1))
      for (let col = 0; col < 6; col++) {
        const cellRef = XLSX.utils.encode_col(col) + row
        wsEstado[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: 'A78BFA' } }
        }
      }
    })

    // Formato de porcentajes y monedas
    for (let i = 5; i <= 7; i++) {
      wsEstado[`C${i}`].z = '0.0%'
      ;['D', 'E', 'F'].forEach(col => {
        const cell = `${col}${i}`
        if (wsEstado[cell]) wsEstado[cell].z = '$#,##0'
      })
    }
    for (let i = 13; i <= 15; i++) {
      wsEstado[`C${i}`].z = '0.0%'
      const cellD = `D${i}`
      if (wsEstado[cellD]) wsEstado[cellD].z = '$#,##0'
    }

    XLSX.utils.book_append_sheet(wb, wsEstado, 'Estado y Distribucion')

    // Generar y descargar
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, `Reporte_Votos_Avanzado_${new Date().getTime()}.xlsx`)

    return { success: true, mensaje: 'Excel avanzado de votos generado con 4 hojas de analisis completo' }
  } catch (error) {
    console.error('Error al generar Excel de votos:', error)
    return { success: false, mensaje: 'Error al generar el Excel' }
  }
}

// ============================================================
// EXPORTACIÓN: Reporte de Ventas por Producto
// ============================================================
export const exportarExcelVentas = (datos: any[]) => {
  if (!datos || datos.length === 0) {
    return { success: false, mensaje: 'No hay datos de ventas para exportar' }
  }

  try {
    const wb = XLSX.utils.book_new()

    // ============ HOJA 1: RESUMEN EJECUTIVO ============
    const totalUnidades = datos.reduce((sum, p) => sum + (p.unidades_vendidas || 0), 0)
    const totalRecaudado = datos.reduce((sum, p) => sum + (p.total_recaudado || 0), 0)
    const totalPendiente = datos.reduce((sum, p) => sum + (p.total_pendiente || 0), 0)
    const totalVentas = datos.reduce((sum, p) => sum + (p.cantidad_ventas || 0), 0)

    const resumen = [
      ['REPORTE DE VENTAS POR PRODUCTO'],
      [''],
      ['Fecha de generación', new Date().toLocaleDateString('es-CO')],
      [''],
      ['RESUMEN GENERAL'],
      ['Métrica', 'Valor'],
      ['Total de productos', datos.length],
      ['Unidades vendidas', totalUnidades],
      ['Cantidad de ventas', totalVentas],
      ['Total recaudado', totalRecaudado],
      ['Total pendiente', totalPendiente],
      ['Total comprometido', totalRecaudado + totalPendiente],
      [''],
      ['PROMEDIOS'],
      ['Métrica', 'Valor'],
      ['Promedio unidades por producto', datos.length > 0 ? totalUnidades / datos.length : 0],
      ['Promedio ventas por producto', datos.length > 0 ? totalVentas / datos.length : 0],
      ['Promedio recaudado por producto', datos.length > 0 ? totalRecaudado / datos.length : 0],
      ['Promedio pendiente por producto', datos.length > 0 ? totalPendiente / datos.length : 0]
    ]

    const wsResumen = XLSX.utils.aoa_to_sheet(resumen)
    wsResumen['!cols'] = [{ wch: 30 }, { wch: 20 }]

    // Estilos
    wsResumen['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center' }
    }
    wsResumen['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }]

    ;['A5', 'A14'].forEach(cell => {
      wsResumen[cell].s = {
        font: { bold: true, sz: 11, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '3B82F6' } }
      }
    })

    // Headers
    ;['A6', 'A15'].forEach(cell => {
      const row = parseInt(cell.substring(1))
      ;['A', 'B'].forEach(col => {
        const cellRef = col + row
        if (wsResumen[cellRef]) {
          wsResumen[cellRef].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '60A5FA' } }
          }
        }
      })
    })

    // Formato de monedas
    ;['B10', 'B11', 'B12', 'B18', 'B19'].forEach(cell => {
      if (wsResumen[cell]) wsResumen[cell].z = '$#,##0'
    })

    // Formato de decimales
    ;['B16', 'B17'].forEach(cell => {
      if (wsResumen[cell]) wsResumen[cell].z = '0.00'
    })

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    // ============ HOJA 2: VENTAS POR PRODUCTO ============
    const ventasData = [
      ['VENTAS POR PRODUCTO - DETALLE'],
      [''],
      ['Producto', 'Precio Unitario', 'Unidades Vendidas', 'Cantidad Ventas', 'Total Recaudado', 'Total Pendiente', 'Total Comprometido', 'Estado']
    ]

    datos.forEach(producto => {
      ventasData.push([
        producto.producto_nombre,
        producto.producto_precio || 0,
        producto.unidades_vendidas || 0,
        producto.cantidad_ventas || 0,
        producto.total_recaudado || 0,
        producto.total_pendiente || 0,
        (producto.total_recaudado || 0) + (producto.total_pendiente || 0),
        producto.estado === 'activo' ? 'Activo' : 'Inactivo'
      ])
    })

    // Agregar fila de totales
    ventasData.push([])
    ventasData.push([
      'TOTALES',
      '',
      totalUnidades,
      totalVentas,
      totalRecaudado,
      totalPendiente,
      totalRecaudado + totalPendiente,
      ''
    ])

    const wsVentas = XLSX.utils.aoa_to_sheet(ventasData)
    wsVentas['!cols'] = [
      { wch: 35 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 12 }
    ]

    // Estilos
    wsVentas['A1'].s = {
      font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3B82F6' } },
      alignment: { horizontal: 'center' }
    }
    wsVentas['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]

    // Header de columnas
    for (let col = 0; col < 8; col++) {
      const cellRef = XLSX.utils.encode_col(col) + '3'
      if (wsVentas[cellRef]) {
        wsVentas[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '60A5FA' } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    // Formato de monedas y números en datos
    for (let i = 4; i < ventasData.length - 1; i++) {
      // Precio unitario
      const cellB = `B${i}`
      if (wsVentas[cellB]) wsVentas[cellB].z = '$#,##0.00'
      
      // Total recaudado, pendiente, comprometido
      ;['E', 'F', 'G'].forEach(col => {
        const cell = `${col}${i}`
        if (wsVentas[cell]) wsVentas[cell].z = '$#,##0'
      })
    }

    // Fila de totales
    const totalRow = ventasData.length
    wsVentas[`A${totalRow}`].s = {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '3B82F6' } }
    }
    ;['C', 'D', 'E', 'F', 'G'].forEach(col => {
      const cell = `${col}${totalRow}`
      if (wsVentas[cell]) {
        wsVentas[cell].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '3B82F6' } }
        }
        if (['E', 'F', 'G'].includes(col)) {
          wsVentas[cell].z = '$#,##0'
        }
      }
    })

    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas por Producto')

    // ============ HOJA 3: TOP PRODUCTOS ============
    const productosOrdenados = [...datos].sort((a, b) => 
      (b.total_recaudado || 0) - (a.total_recaudado || 0)
    )
    const top10 = productosOrdenados.slice(0, 10)

    const topData = [
      ['TOP 10 PRODUCTOS POR RECAUDACIÓN'],
      [''],
      ['Ranking', 'Producto', 'Unidades', 'Ventas', 'Recaudado', 'Pendiente', 'Estado']
    ]

    top10.forEach((producto, index) => {
      topData.push([
        index + 1,
        producto.producto_nombre,
        producto.unidades_vendidas || 0,
        producto.cantidad_ventas || 0,
        producto.total_recaudado || 0,
        producto.total_pendiente || 0,
        producto.estado === 'activo' ? 'Activo' : 'Inactivo'
      ])
    })

    const wsTop = XLSX.utils.aoa_to_sheet(topData)
    wsTop['!cols'] = [
      { wch: 10 },
      { wch: 35 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 }
    ]

    // Estilos
    wsTop['A1'].s = {
      font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '10B981' } },
      alignment: { horizontal: 'center' }
    }
    wsTop['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }]

    // Header
    for (let col = 0; col < 7; col++) {
      const cellRef = XLSX.utils.encode_col(col) + '3'
      if (wsTop[cellRef]) {
        wsTop[cellRef].s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '34D399' } },
          alignment: { horizontal: 'center' }
        }
      }
    }

    // Formato de monedas
    for (let i = 4; i < topData.length; i++) {
      ;['E', 'F'].forEach(col => {
        const cell = `${col}${i}`
        if (wsTop[cell]) wsTop[cell].z = '$#,##0'
      })
    }

    XLSX.utils.book_append_sheet(wb, wsTop, 'Top 10 Productos')

    // Generar y descargar
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    saveAs(blob, `Reporte_Ventas_Productos_${new Date().getTime()}.xlsx`)

    return { success: true, mensaje: 'Excel de ventas generado con 3 hojas de análisis completo' }
  } catch (error) {
    console.error('Error al generar Excel de ventas:', error)
    return { success: false, mensaje: 'Error al generar el Excel' }
  }
}
