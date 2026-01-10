/**
 * Generadores de reportes para proyectos de comité
 * Permite exportar ventas y productos en PDF y Excel
 */

interface DatosVentasProyecto {
  productos: any[]
  ventas: any[]
  resumenVentas: any
  proyectoId: string
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

    const totalVendido = datos.resumenVentas?.total_vendido || 0
    const totalRecaudado = datos.resumenVentas?.total_recaudado || 0
    const totalPendiente = datos.resumenVentas?.pendiente || 0

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

    // Hoja 1: Resumen
    const resumenData = [
      ['REPORTE DE VENTAS - PROYECTO DE COMITÉ'],
      ['Generado:', new Date().toLocaleDateString('es-CO')],
      [''],
      ['RESUMEN GENERAL'],
      ['Total Vendido', datos.resumenVentas?.total_vendido || 0],
      ['Total Recaudado', datos.resumenVentas?.total_recaudado || 0],
      ['Pendiente', datos.resumenVentas?.pendiente || 0],
      ['Productos', datos.productos?.length || 0],
      ['Ventas', datos.ventas?.length || 0],
      ['Compradores Únicos', datos.ventas ? [...new Set(datos.ventas.map((v: any) => v.comprador_nombre))].length : 0]
    ]
    
    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
    
    // Estilos básicos para el resumen
    wsResumen['!cols'] = [{ wch: 20 }, { wch: 20 }]
    
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

    // Hoja 2: Ventas por Producto
    const ventasPorProducto = new Map()
    
    datos.ventas?.forEach((venta: any) => {
      const productoId = venta.producto_id
      if (!ventasPorProducto.has(productoId)) {
        const producto = datos.productos?.find(p => p.id === productoId)
        ventasPorProducto.set(productoId, {
          Producto: producto?.nombre || 'Producto desconocido',
          'Precio Unitario': producto?.precio_unitario || 0,
          Unidades: 0,
          'Total Vendido': 0,
          Recaudado: 0,
          Pendiente: 0
        })
      }
      
      const item = ventasPorProducto.get(productoId)
      item.Unidades += venta.cantidad || 0
      item['Total Vendido'] += venta.valor_total || 0
      item.Recaudado += venta.monto_pagado || 0
      item.Pendiente += venta.saldo_pendiente || 0
    })

    const productosArray = Array.from(ventasPorProducto.values())
    
    if (productosArray.length > 0) {
      const wsProductos = XLSX.utils.json_to_sheet(productosArray)
      
      // Configurar anchos de columna
      wsProductos['!cols'] = [
        { wch: 30 }, // Producto
        { wch: 15 }, // Precio Unitario
        { wch: 10 }, // Unidades
        { wch: 15 }, // Total Vendido
        { wch: 15 }, // Recaudado
        { wch: 15 }  // Pendiente
      ]
      
      XLSX.utils.book_append_sheet(wb, wsProductos, 'Ventas por Producto')
    }

    // Hoja 3: Detalle de Ventas
    const ventasDetalle = datos.ventas?.map((venta: any) => {
      const producto = datos.productos?.find(p => p.id === venta.producto_id)
      return {
        Fecha: venta.fecha_venta ? new Date(venta.fecha_venta).toLocaleDateString('es-CO') : '',
        Producto: producto?.nombre || 'N/A',
        Cantidad: venta.cantidad || 0,
        'Valor Total': venta.valor_total || 0,
        Recaudado: venta.monto_pagado || 0,
        Pendiente: venta.saldo_pendiente || 0,
        Estado: venta.estado || 'N/A'
      }
    }) || []

    if (ventasDetalle.length > 0) {
      const wsDetalle = XLSX.utils.json_to_sheet(ventasDetalle)
      
      wsDetalle['!cols'] = [
        { wch: 12 }, // Fecha
        { wch: 30 }, // Producto
        { wch: 10 }, // Cantidad
        { wch: 15 }, // Valor Total
        { wch: 15 }, // Recaudado
        { wch: 15 }, // Pendiente
        { wch: 12 }  // Estado
      ]
      
      XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle de Ventas')
    }

    // Hoja 4: Compradores
    const compradoresMap = new Map<string, any[]>()
    datos.ventas?.forEach((venta: any) => {
      const nombre = venta.comprador_nombre
      if (!compradoresMap.has(nombre)) {
        compradoresMap.set(nombre, [])
      }
      compradoresMap.get(nombre)!.push(venta)
    })

    const compradoresArray = Array.from(compradoresMap.entries())
      .map(([nombre, ventasComprador]) => {
        const totalCompras = ventasComprador.length
        const totalUnidades = ventasComprador.reduce((sum: number, v: any) => sum + v.cantidad, 0)
        const valorTotal = ventasComprador.reduce((sum: number, v: any) => sum + v.valor_total, 0)
        const totalPagado = ventasComprador.reduce((sum: number, v: any) => sum + v.monto_pagado, 0)
        const pendiente = valorTotal - totalPagado
        const ultimaCompra = new Date(Math.max(...ventasComprador.map((v: any) => new Date(v.fecha_venta).getTime())))

        return {
          Comprador: nombre,
          'Total Compras': totalCompras,
          'Unidades Totales': totalUnidades,
          'Valor Total': valorTotal,
          'Total Pagado': totalPagado,
          'Pendiente': pendiente,
          'Última Compra': ultimaCompra.toLocaleDateString('es-CO'),
          'Estado': pendiente === 0 ? 'Pagado' : 'Pendiente'
        }
      })
      .sort((a, b) => b['Valor Total'] - a['Valor Total'])

    if (compradoresArray.length > 0) {
      const wsCompradores = XLSX.utils.json_to_sheet(compradoresArray)
      
      wsCompradores['!cols'] = [
        { wch: 30 }, // Comprador
        { wch: 12 }, // Total Compras
        { wch: 15 }, // Unidades Totales
        { wch: 15 }, // Valor Total
        { wch: 15 }, // Total Pagado
        { wch: 15 }, // Pendiente
        { wch: 15 }, // Última Compra
        { wch: 12 }  // Estado
      ]
      
      XLSX.utils.book_append_sheet(wb, wsCompradores, 'Compradores')
    }

    // Hoja 5: Productos
    const productosInfo = datos.productos?.map(producto => ({
      Nombre: producto.nombre || '',
      'Precio Unitario': producto.precio_unitario || 0,
      Descripción: producto.descripcion || '',
      Estado: producto.estado || 'activo'
    })) || []

    if (productosInfo.length > 0) {
      const wsProductosInfo = XLSX.utils.json_to_sheet(productosInfo)
      
      wsProductosInfo['!cols'] = [
        { wch: 30 }, // Nombre
        { wch: 15 }, // Precio
        { wch: 40 }, // Descripción
        { wch: 12 }  // Estado
      ]
      
      XLSX.utils.book_append_sheet(wb, wsProductosInfo, 'Productos')
    }

    // Generar el archivo Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    
    FileSaver.saveAs(blob, `reporte-ventas-proyecto-${new Date().getTime()}.xlsx`)

    return { success: true, mensaje: 'Excel generado correctamente' }
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
