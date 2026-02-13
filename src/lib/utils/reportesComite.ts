/**
 * Generadores de reportes para proyectos de comité
 * Permite exportar ventas y productos en PDF y Excel
 */

interface DatosVentasProyecto {
  productos: any[]
  ventas: any[]
  resumenVentas: any
  proyectoId: string
  nombreOrganizacion?: string
}

/**
 * Genera un PDF con el reporte de ventas del proyecto
 */
export async function generarPDFVentasProyecto(datos: DatosVentasProyecto) {
  try {
    // Importación dinámica para evitar errores si no está instalado
    const jsPDF = (await import('jspdf')).default
    const autoTable = (await import('jspdf-autotable')).default

    const doc = new jsPDF()
    const fechaActual = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    // Configurar fuente y colores
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(91, 33, 182) // Púrpura

    // Título
    doc.text('REPORTE DE VENTAS', 105, 20, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Proyecto de Comité`, 105, 28, { align: 'center' })
    doc.text(`Generado: ${fechaActual}`, 105, 34, { align: 'center' })

    // Resumen general
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Resumen General', 14, 45)

    const totalVendido = datos.resumenVentas?.valor_total_ventas || 0
    const totalRecaudado = datos.resumenVentas?.total_recaudado || 0
    const totalPendiente = datos.resumenVentas?.total_pendiente || 0

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    // Cuadros de resumen
    const resumenData = [
      ['Total Vendido', `$${totalVendido.toLocaleString()}`],
      ['Total Recaudado', `$${totalRecaudado.toLocaleString()}`],
      ['Pendiente', `$${totalPendiente.toLocaleString()}`],
      ['Productos', `${datos.productos?.length || 0}`],
      ['Ventas', `${datos.ventas?.length || 0} pagadas`],
      ['Compradores Únicos', `${datos.ventas ? [...new Set(datos.ventas.map((v: any) => v.comprador_nombre))].length : 0}`]
    ]

    autoTable(doc, {
      startY: 50,
      head: [['Concepto', 'Valor']],
      body: resumenData,
      theme: 'grid',
      headStyles: {
        fillColor: [147, 51, 234], // Púrpura
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: { fillColor: [250, 245, 255] },
      margin: { left: 14, right: 14 }
    })

    // Tabla de ventas por producto
    const finalY = (doc as any).lastAutoTable.finalY || 100

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Ventas por Producto', 14, finalY + 10)

    // Agrupar ventas por producto
    const ventasPorProducto = new Map()

    datos.ventas?.forEach((venta: any) => {
      const productoId = venta.producto_id
      if (!ventasPorProducto.has(productoId)) {
        const producto = datos.productos?.find(p => p.id === productoId)
        ventasPorProducto.set(productoId, {
          nombre: producto?.nombre || 'Producto desconocido',
          precio: producto?.precio_unitario || 0,
          cantidad: 0,
          total: 0,
          recaudado: 0,
          pendiente: 0
        })
      }

      const item = ventasPorProducto.get(productoId)
      item.cantidad += venta.cantidad || 0
      item.total += venta.valor_total || 0
      item.recaudado += venta.monto_pagado || 0
      item.pendiente += venta.saldo_pendiente || 0
    })

    const productosData = Array.from(ventasPorProducto.values()).map(item => [
      item.nombre,
      `$${item.precio.toLocaleString()}`,
      item.cantidad.toString(),
      `$${item.recaudado.toLocaleString()}`,
      `$${item.pendiente.toLocaleString()}`,
      `$${item.total.toLocaleString()}`
    ])

    if (productosData.length > 0) {
      autoTable(doc, {
        startY: finalY + 15,
        head: [['Producto', 'Precio', 'Unid.', 'Recaudado', 'Pendiente', 'Total']],
        body: productosData,
        theme: 'grid',
        headStyles: {
          fillColor: [147, 51, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 25, halign: 'right' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 30, halign: 'right' }
        }
      })
    }

    // Tabla de compradores
    const finalY2 = (doc as any).lastAutoTable.finalY || finalY + 80

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Compradores', 14, finalY2 + 10)

    // Agrupar ventas por comprador
    const compradoresMap = new Map<string, any[]>()
    datos.ventas?.forEach((venta: any) => {
      const nombre = venta.comprador_nombre
      if (!compradoresMap.has(nombre)) {
        compradoresMap.set(nombre, [])
      }
      compradoresMap.get(nombre)!.push(venta)
    })

    const compradoresData = Array.from(compradoresMap.entries())
      .map(([nombre, ventasComprador]) => {
        const totalCompras = ventasComprador.length
        const totalUnidades = ventasComprador.reduce((sum: number, v: any) => sum + v.cantidad, 0)
        const valorTotal = ventasComprador.reduce((sum: number, v: any) => sum + v.valor_total, 0)
        const totalPagado = ventasComprador.reduce((sum: number, v: any) => sum + v.monto_pagado, 0)
        const pendiente = valorTotal - totalPagado

        return [
          nombre,
          totalCompras.toString(),
          totalUnidades.toString(),
          `$${valorTotal.toLocaleString()}`,
          `$${totalPagado.toLocaleString()}`,
          `$${pendiente.toLocaleString()}`
        ]
      })
      .sort((a, b) => parseFloat(b[3].replace(/[$,]/g, '')) - parseFloat(a[3].replace(/[$,]/g, '')))

    if (compradoresData.length > 0) {
      autoTable(doc, {
        startY: finalY2 + 15,
        head: [['Comprador', 'Compras', 'Unid.', 'Total', 'Pagado', 'Pendiente']],
        body: compradoresData,
        theme: 'grid',
        headStyles: {
          fillColor: [147, 51, 234],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 15, halign: 'center' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 25, halign: 'right' }
        }
      })
    }

    // Pie de página (Marca de agua sutil)
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(200, 200, 200) // Gris muy claro
    doc.text('SOFTWARE BY JUAN AGUILAR', 105, pageHeight - 10, { align: 'center' })

    // Guardar el PDF
    doc.save(`reporte-ventas-proyecto-${new Date().getTime()}.pdf`)

    return { success: true, mensaje: 'PDF generado correctamente' }
  } catch (error) {
    console.error('Error generando PDF:', error)

    if ((error as any)?.message?.includes('jspdf')) {
      return {
        success: false,
        mensaje: 'Dependencias no instaladas. Ejecuta: npm install jspdf jspdf-autotable'
      }
    }

    return {
      success: false,
      mensaje: 'Error al generar el PDF: ' + (error as Error).message
    }
  }
}

/**
 * Genera un archivo Excel con el reporte de ventas del proyecto
 */
export async function generarExcelVentasProyecto(datos: DatosVentasProyecto) {
  try {
    // Importación dinámica
    const XLSX = await import('xlsx')
    const FileSaver = await import('file-saver')

    // Crear un nuevo libro
    const wb = XLSX.utils.book_new()

    // --- HOJA 1: DASHBOARD DE RESUMEN ---
    const dashboardData = [
      ['INFORME EJECUTIVO DE PROYECTO'],
      ['SISTEMA DE GESTIÓN CONTABLE ' + (datos.nombreOrganizacion || 'IPUC')],
      [''],
      ['INFORMACIÓN DEL REPORTE'],
      ['Fecha de Emisión:', new Date().toLocaleDateString('es-CO')],
      ['Proyecto ID:', datos.proyectoId],
      ['Estado del Proyecto:', datos.resumenVentas?.total_pendiente === 0 ? 'COMPLETADO' : 'EN EJECUCIÓN'],
      [''],
      ['MÉTRICAS FINANCIERAS', 'VALOR'],
      ['Total Venta Bruta', datos.resumenVentas?.valor_total_ventas || 0],
      ['Recaudación Efectiva', datos.resumenVentas?.total_recaudado || 0],
      ['Cartera Pendiente', datos.resumenVentas?.total_pendiente || 0],
      ['% de Recaudación', datos.resumenVentas?.valor_total_ventas > 0
        ? ((datos.resumenVentas?.total_recaudado / datos.resumenVentas?.valor_total_ventas) * 100).toFixed(2) + '%'
        : '0%'],
      [''],
      ['ESTADÍSTICAS OPERATIVAS', 'CANTIDAD'],
      ['Productos en Catálogo', datos.productos?.length || 0],
      ['Transacciones Realizadas', datos.ventas?.length || 0],
      ['Compradores Únicos', datos.ventas ? [...new Set(datos.ventas.map((v: any) => v.comprador_nombre))].length : 0],
      ['Promedio por Venta', datos.ventas?.length > 0
        ? (datos.resumenVentas?.valor_total_ventas / datos.ventas.length)
        : 0],
      [''],
      [''],
      ['SOFTWARE BY JUAN AGUILAR']
    ]

    const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData)
    wsDashboard['!cols'] = [{ wch: 30 }, { wch: 25 }]
    XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard')

    // --- HOJA 2: ANÁLISIS DE PRODUCTOS ---
    const ventasPorProducto = new Map()
    let totalUnid = 0, totalVendido = 0, totalRec = 0, totalPen = 0

    datos.ventas?.forEach((venta: any) => {
      const productoId = venta.producto_id
      if (!ventasPorProducto.has(productoId)) {
        const producto = datos.productos?.find(p => p.id === productoId)
        ventasPorProducto.set(productoId, {
          Producto: producto?.nombre || 'Desconocido',
          'Precio Ref.': producto?.precio_unitario || 0,
          'Unid. Vendidas': 0,
          'Total Bruto': 0,
          'Total Recaudado': 0,
          'Saldo en Mora': 0,
          '% Cumplimiento': 0
        })
      }

      const item = ventasPorProducto.get(productoId)
      item['Unid. Vendidas'] += venta.cantidad || 0
      item['Total Bruto'] += venta.valor_total || 0
      item['Total Recaudado'] += venta.monto_pagado || 0
      item['Saldo en Mora'] += venta.saldo_pendiente || 0

      totalUnid += venta.cantidad || 0
      totalVendido += venta.valor_total || 0
      totalRec += venta.monto_pagado || 0
      totalPen += venta.saldo_pendiente || 0
    })

    const productosArray = Array.from(ventasPorProducto.values()).map(p => ({
      ...p,
      '% Cumplimiento': p['Total Bruto'] > 0 ? ((p['Total Recaudado'] / p['Total Bruto']) * 100).toFixed(1) + '%' : '0%'
    }))

    // Agregar Fila de Totales
    productosArray.push({
      Producto: 'TOTAL GENERAL',
      'Precio Ref.': null,
      'Unid. Vendidas': totalUnid,
      'Total Bruto': totalVendido,
      'Total Recaudado': totalRec,
      'Saldo en Mora': totalPen,
      '% Cumplimiento': totalVendido > 0 ? ((totalRec / totalVendido) * 100).toFixed(1) + '%' : '0%'
    })

    const wsAnálisis = XLSX.utils.json_to_sheet(productosArray)
    wsAnálisis['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsAnálisis, 'Análisis x Producto')

    // --- HOJA 3: CRONOLOGÍA DE VENTAS ---
    const ventasDetalle = datos.ventas?.map((venta: any) => {
      const producto = datos.productos?.find(p => p.id === venta.producto_id)
      return {
        Fecha: venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleDateString('es-CO') : '',
        Comprador: venta.comprador_nombre || 'N/A',
        Producto: producto?.nombre || 'N/A',
        Cantidad: venta.cantidad || 0,
        'Venta Total': venta.valor_total || 0,
        Pagado: venta.monto_pagado || 0,
        'Pendiente': (venta.valor_total - venta.monto_pagado) || 0,
        Estado: (venta.valor_total - venta.monto_pagado) === 0 ? 'PAGADO' : 'PENDIENTE'
      }
    }) || []

    if (ventasDetalle.length > 0) {
      const wsVentas = XLSX.utils.json_to_sheet(ventasDetalle)
      wsVentas['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, wsVentas, 'Registro de Ventas')
    }

    // --- HOJA 4: RANKING DE COMPRADORES ---
    const compradoresMap = new Map<string, any[]>()
    datos.ventas?.forEach((venta: any) => {
      const nombre = venta.comprador_nombre
      if (!compradoresMap.has(nombre)) compradoresMap.set(nombre, [])
      compradoresMap.get(nombre)!.push(venta)
    })

    const rankingCompradores = Array.from(compradoresMap.entries())
      .map(([nombre, ventasComprador]) => {
        const valorTotal = ventasComprador.reduce((sum: number, v: any) => sum + v.valor_total, 0)
        const totalPagado = ventasComprador.reduce((sum: number, v: any) => sum + v.monto_pagado, 0)
        return {
          'Nombre del Cliente': nombre,
          'Frecuencia (Compras)': ventasComprador.length,
          'Volumen Artículos': ventasComprador.reduce((sum: number, v: any) => sum + v.cantidad, 0),
          'Inversión Total': valorTotal,
          'Aportes Realizados': totalPagado,
          'Saldo Deudor': valorTotal - totalPagado,
          Status: valorTotal - totalPagado === 0 ? 'AL DÍA' : 'CON SALDO'
        }
      })
      .sort((a, b) => b['Inversión Total'] - a['Inversión Total'])

    const wsRanking = XLSX.utils.json_to_sheet(rankingCompradores)
    wsRanking['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsRanking, 'Ranking Compradores')

    // --- HOJA 5: CATÁLOGO DE PRODUCTOS ---
    const catálogo = datos.productos?.map(p => ({
      Referencia: p.nombre || '',
      'Precio Base': p.precio_unitario || 0,
      'Descripción Técnica': p.descripcion || 'Sin descripción',
      'Estado Catálogo': p.estado?.toUpperCase() || 'ACTIVO'
    })) || []

    const wsCatálogo = XLSX.utils.json_to_sheet(catálogo)
    wsCatálogo['!cols'] = [{ wch: 35 }, { wch: 15 }, { wch: 50 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsCatálogo, 'Catálogo Referencia')

    // Añadir Firma a cada hoja (en la última fila)
    wb.SheetNames.forEach(sheetName => {
      const ws = wb.Sheets[sheetName]
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      const lastRow = range.e.r + 2
      XLSX.utils.sheet_add_aoa(ws, [['REPORTE GENERADO'], ['SOFTWARE BY JUAN AGUILAR']], { origin: { r: lastRow, c: 0 } })
    })

    // Finalizar y descargar
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    FileSaver.saveAs(blob, `INFORME_EJECUTIVO_${datos.proyectoId.slice(0, 8)}_${new Date().getTime()}.xlsx`)

    return { success: true, mensaje: 'Excel profesional generado correctamente' }
  } catch (error) {
    console.error('Error generando Excel:', error)

    if ((error as any)?.message?.includes('xlsx') || (error as any)?.message?.includes('file-saver')) {
      return {
        success: false,
        mensaje: 'Dependencias no instaladas. Ejecuta: npm install xlsx file-saver'
      }
    }

    return {
      success: false,
      mensaje: 'Error al generar el Excel: ' + (error as Error).message
    }
  }
}
