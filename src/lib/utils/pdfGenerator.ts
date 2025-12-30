import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PDFColumn {
  header: string
  dataKey: string
}

interface PDFOptions {
  titulo: string
  subtitulo?: string
  columnas: PDFColumn[]
  datos: any[]
  orientacion?: 'portrait' | 'landscape'
}

export const generarPDF = ({ titulo, subtitulo, columnas, datos, orientacion = 'portrait' }: PDFOptions) => {
  try {
    // Crear documento PDF
    const doc = new jsPDF({
      orientation: orientacion,
      unit: 'mm',
      format: 'a4'
    })

    // Configurar fuentes
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)

    // Título principal
    doc.text(titulo, 14, 20)

    // Subtítulo (si existe)
    if (subtitulo) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(subtitulo, 14, 28)
    }

    // Información adicional
    doc.setFontSize(9)
    doc.setTextColor(150)
    const fecha = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    doc.text(`Generado: ${fecha}`, 14, subtitulo ? 34 : 28)
    doc.text('IPUC Contabilidad', doc.internal.pageSize.getWidth() - 14, subtitulo ? 34 : 28, { align: 'right' })

    // Línea separadora
    doc.setDrawColor(200)
    doc.line(14, subtitulo ? 38 : 32, doc.internal.pageSize.getWidth() - 14, subtitulo ? 38 : 32)

    // Tabla con datos
    autoTable(doc, {
      startY: subtitulo ? 42 : 36,
      head: [columnas.map(col => col.header)],
      body: datos.map(row => columnas.map(col => {
        const value = row[col.dataKey]
        // Formatear números como moneda si es necesario
        if (typeof value === 'number' && col.dataKey.includes('monto') || col.dataKey.includes('total') || col.dataKey.includes('pagado') || col.dataKey.includes('pendiente') || col.dataKey.includes('comprometido')) {
          return `$${value.toLocaleString('es-CO')}`
        }
        return value || '-'
      })),
      theme: 'striped',
      headStyles: {
        fillColor: [59, 130, 246], // Azul
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: 50
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        // Footer en cada página
        const pageCount = doc.getNumberOfPages()
        const pageNumber = doc.getCurrentPageInfo().pageNumber
        
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `Página ${pageNumber} de ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        )
      }
    })

    // Resumen al final (si hay datos numéricos)
    const hasNumericData = columnas.some(col => 
      col.dataKey.includes('monto') || 
      col.dataKey.includes('total') || 
      col.dataKey.includes('pagado') || 
      col.dataKey.includes('pendiente')
    )

    if (hasNumericData && datos.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(50)
      doc.text('Resumen:', 14, finalY)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Total de registros: ${datos.length}`, 14, finalY + 6)
    }

    // Descargar PDF
    const nombreArchivo = `${titulo.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`
    doc.save(nombreArchivo)

    return { success: true, mensaje: 'PDF generado exitosamente' }
  } catch (error) {
    console.error('Error al generar PDF:', error)
    return { success: false, mensaje: 'Error al generar el PDF' }
  }
}

// Función específica para reporte financiero avanzado
export const generarPDFFinanciero = (datos: any) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 15
  const marginLeft = 14
  const marginRight = 14
  const contentWidth = pageWidth - (marginLeft + marginRight)
  const minBottomMargin = 25 // Espacio mínimo al final de página

  // Función para agregar nueva página con header
  const addNewPage = () => {
    doc.addPage()
    yPos = 25 // Espacio suficiente para header
    // Header de nueva página
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text('REPORTE FINANCIERO CONSOLIDADO', pageWidth / 2, 12, { align: 'center' })
  }

  // Función para verificar y manejar espacio disponible
  const ensureSpace = (neededSpace: number) => {
    if (yPos + neededSpace > pageHeight - minBottomMargin) {
      addNewPage()
    }
  }

  // Función para agregar sección con título
  const addSectionTitle = (titulo: string) => {
    ensureSpace(15)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(59, 130, 246)
    doc.text(titulo.toUpperCase(), marginLeft, yPos)

    // Línea bajo el título
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(0.5)
    doc.line(marginLeft, yPos + 2, pageWidth - marginLeft, yPos + 2)

    yPos += 12
  }

  // PORTADA
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(59, 130, 246)
  doc.text('REPORTE FINANCIERO', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 12
  doc.setFontSize(24)
  doc.text('CONSOLIDADO', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 25

  // Fecha
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(100)
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Fecha de Generacion: ${fecha}`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 20

  // Línea decorativa
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(1)
  doc.line(marginLeft, yPos, pageWidth - marginLeft, yPos)
  yPos += 15

  // SECCIÓN 1: INDICADORES PRINCIPALES (KPIs)
  addSectionTitle('Indicadores Principales')

  const kpis = [
    { label: 'Total Comprometido', valor: datos.total_comprometido, color: [59, 130, 246] },
    { label: 'Total Recaudado', valor: datos.total_recaudado, color: [34, 197, 94] },
    { label: 'Total Pendiente', valor: datos.total_pendiente, color: [251, 146, 60] },
    { label: 'Porcentaje Cumplimiento', valor: `${datos.porcentaje_cumplimiento.toFixed(1)}%`, color: [168, 85, 247] }
  ]

  kpis.forEach((kpi) => {
    ensureSpace(16)
    // Fondo de color con esquinas redondeadas
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2])
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2])
    doc.roundedRect(marginLeft, yPos - 3, contentWidth, 11, 2, 2, 'FD')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(255)
    doc.text(kpi.label, marginLeft + 3, yPos + 2)

    // Valor
    const valorFormateado = typeof kpi.valor === 'string'
      ? kpi.valor
      : `$${kpi.valor.toLocaleString('es-CO')}`
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(valorFormateado, pageWidth - marginLeft - 2, yPos + 2, { align: 'right' })

    yPos += 16
  })

  yPos += 5

  // SECCIÓN 2: MÉTRICAS OPERATIVAS
  addSectionTitle('Metricas Operativas')

  const metricasData = [
    ['Miembros Activos', `${datos.total_miembros_activos}`, 'personas'],
    ['Total de Votos', `${datos.total_votos}`, 'votos'],
    ['Promedio por Miembro', `$${datos.promedio_por_miembro.toLocaleString('es-CO')}`, ''],
    ['Promedio por Voto', `$${datos.promedio_por_voto.toLocaleString('es-CO')}`, ''],
    ['Eficiencia de Recaudacion', `${datos.eficiencia_recaudacion.toFixed(1)}%`, ''],
    ['Tasa de Vencimiento', `${datos.tasa_vencimiento.toFixed(1)}%`, '']
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50)

  metricasData.forEach(([label, valor, unidad]) => {
    ensureSpace(9)
    doc.text(label, marginLeft + 2, yPos)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const textoValor = unidad ? `${valor} ${unidad}` : valor
    doc.text(textoValor, pageWidth - marginLeft - 2, yPos, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    yPos += 9
  })

  yPos += 5

  // SECCIÓN 3: DISTRIBUCIÓN POR RANGOS
  addSectionTitle('Distribucion por Rangos')

  const distribuccion = [
    [`Pequenos (< $500K)`, datos.votos_pequenos],
    [`Medianos ($500K - $2M)`, datos.votos_medianos],
    [`Grandes (> $2M)`, datos.votos_grandes]
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50)

  distribuccion.forEach(([label, valor]) => {
    ensureSpace(9)
    doc.text(label, marginLeft + 2, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(valor.toString(), pageWidth - marginLeft - 2, yPos, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    yPos += 9
  })

  yPos += 5

  // SECCIÓN 4: ESTADO DE VOTOS
  addSectionTitle('Estado de Votos')

  const estadoVotos = [
    ['Votos Activos', datos.votos_activos],
    ['Votos Completados', datos.votos_completados],
    ['Votos Vencidos', datos.votos_vencidos]
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50)

  estadoVotos.forEach(([label, valor]) => {
    ensureSpace(9)
    doc.text(label, marginLeft + 2, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(valor.toString(), pageWidth - marginLeft - 2, yPos, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    yPos += 9
  })

  yPos += 5

  // SECCIÓN 5: ANÁLISIS DE TENDENCIAS
  addSectionTitle('Analisis de Tendencias')

  const tendencias = [
    ['Recaudacion Mes Actual', `$${datos.recaudacion_mes_actual.toLocaleString('es-CO')}`],
    ['Recaudacion Mes Anterior', `$${datos.recaudacion_mes_anterior.toLocaleString('es-CO')}`],
    ['Variacion Mensual', `${datos.variacion_mensual > 0 ? '+' : ''}${datos.variacion_mensual.toFixed(1)}%`],
    ['Crecimiento Promedio', `${datos.crecimiento_mensual > 0 ? '+' : ''}${datos.crecimiento_mensual.toFixed(1)}%`]
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50)

  tendencias.forEach(([label, valor]) => {
    ensureSpace(9)
    doc.text(label, marginLeft + 2, yPos)
    doc.setFont('helvetica', 'bold')

    // Colorear variación positiva o negativa
    if (label.includes('Variacion') || label.includes('Crecimiento')) {
      const numVal = parseFloat(valor)
      doc.setTextColor(numVal >= 0 ? 34 : 239, numVal >= 0 ? 197 : 68, numVal >= 0 ? 94 : 68)
    }

    doc.text(valor, pageWidth - marginLeft - 2, yPos, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(50)
    yPos += 9
  })

  yPos += 8

  // SECCIÓN 6: TOP CONTRIBUYENTES
  if (datos.top_miembros && datos.top_miembros.length > 0) {
    addSectionTitle('Top Contribuyentes')

    // Calcular espacio necesario para la tabla completa
    const headerHeight = 10
    const rowHeight = 8
    const maxRows = 8
    const tableSpace = headerHeight + (maxRows * rowHeight) + 10

    // Si no cabe la tabla completa, forzar nueva página
    if (yPos + tableSpace > pageHeight - minBottomMargin) {
      addNewPage()
      addSectionTitle('Top Contribuyentes')
    }

    // Tabla de contribuyentes
    const topData = datos.top_miembros.slice(0, maxRows).map((m: any, idx: number) => [
      (idx + 1).toString(),
      m.nombre,
      `$${m.total_comprometido.toLocaleString('es-CO')}`,
      `${m.porcentaje_cumplimiento.toFixed(1)}%`
    ])

    // Headers
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255)
    doc.setFillColor(59, 130, 246)
    doc.rect(marginLeft, yPos - 4, contentWidth, 8, 'F')

    doc.text('#', marginLeft + 2, yPos + 2)
    doc.text('Nombre', marginLeft + 8, yPos + 2)
    doc.text('Comprometido', marginLeft + 55, yPos + 2)
    doc.text('Cumplimiento', pageWidth - marginLeft - 5, yPos + 2, { align: 'right' })

    yPos += 10

    // Filas de datos
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(50)

    topData.forEach((row: any, idx: number) => {
      // Verificar espacio para cada fila
      if (yPos + 10 > pageHeight - minBottomMargin) {
        addNewPage()
        // Re-dibujar headers en nueva página
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(255)
        doc.setFillColor(59, 130, 246)
        doc.rect(marginLeft, yPos - 4, contentWidth, 8, 'F')

        doc.text('#', marginLeft + 2, yPos + 2)
        doc.text('Nombre', marginLeft + 8, yPos + 2)
        doc.text('Comprometido', marginLeft + 55, yPos + 2)
        doc.text('Cumplimiento', pageWidth - marginLeft - 5, yPos + 2, { align: 'right' })

        yPos += 10
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(50)
      }

      // Fondo alternado para mejor lectura
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(marginLeft, yPos - 3, contentWidth, 6, 'F')
      }

      doc.text(row[0], marginLeft + 2, yPos + 1)
      doc.text(row[1].substring(0, 22), marginLeft + 8, yPos + 1)
      doc.text(row[2], marginLeft + 55, yPos + 1)
      doc.text(row[3], pageWidth - marginLeft - 5, yPos + 1, { align: 'right' })

      yPos += 8
    })
  }

  yPos += 8

  // SECCIÓN 7: ANÁLISIS POR PROPÓSITOS
  if (datos.analisis_propositos && datos.analisis_propositos.length > 0) {
    addSectionTitle('Analisis por Propositos')

    const propositosToShow = datos.analisis_propositos.slice(0, 6)
    const propositoSpace = 15 // Espacio por propósito

    propositosToShow.forEach((prop: any) => {
      ensureSpace(propositoSpace)

      // Nombre del propósito
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(31, 41, 55)
      doc.text(prop.nombre.substring(0, 35), marginLeft, yPos)
      yPos += 6

      // Barra de progreso
      const barWidth = contentWidth - 40
      const progress = Math.min(prop.porcentaje_avance / 100, 1)

      // Fondo de barra
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.rect(marginLeft, yPos - 1, barWidth, 4)
      
      // Barra de progreso
      doc.setFillColor(59, 130, 246)
      doc.rect(marginLeft, yPos - 1, barWidth * progress, 4, 'F')
      
      // Porcentaje
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(59, 130, 246)
      doc.text(`${prop.porcentaje_avance.toFixed(1)}%`, marginLeft + barWidth + 5, yPos + 1)
      
      yPos += 7

      // Información adicional
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(
        `${prop.votos_count} votos | Recaudado: $${prop.total_recaudado.toLocaleString('es-CO')}`,
        marginLeft,
        yPos
      )
      yPos += 6
    })
  }

  // Footer en todas las páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150)
    
    const pageText = `Pagina ${i} de ${totalPages}`
    const dateText = new Date().toLocaleDateString('es-CO')
    
    doc.text(pageText, marginLeft, pageHeight - 10)
    doc.text('IPUC Contabilidad - Reporte Financiero', pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.text(dateText, pageWidth - marginLeft, pageHeight - 10, { align: 'right' })
  }

  doc.save(`Reporte_Financiero_${new Date().getTime()}.pdf`)
  
  return { success: true, mensaje: 'PDF financiero avanzado generado exitosamente' }
}

// Función específica para reporte de pagos
export const generarPDFPagos = (datos: any[]) => {
  return generarPDF({
    titulo: 'Historial de Pagos',
    subtitulo: `Total de pagos: ${datos.length}`,
    columnas: [
      { header: 'Fecha', dataKey: 'fecha_pago' },
      { header: 'Miembro', dataKey: 'miembro_nombre' },
      { header: 'Propósito', dataKey: 'voto_proposito' },
      { header: 'Monto', dataKey: 'monto' },
      { header: 'Método', dataKey: 'metodo_pago' }
    ],
    datos,
    orientacion: 'landscape'
  })
}

// Función específica para reporte avanzado de miembros
export const generarPDFMiembros = (datos: any[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 15
  const marginLeft = 14
  const marginRight = 14
  const contentWidth = pageWidth - (marginLeft + marginRight)

  // Función para agregar nueva página con header
  const addNewPage = () => {
    doc.addPage()
    yPos = 20 // Más espacio al inicio para evitar cortes
    // Header de nueva página
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text('REPORTE DE MIEMBROS - IPUC CONTABILIDAD', pageWidth / 2, 12, { align: 'center' })
  }

  // Función mejorada para verificar si necesita nueva página
  const ensureSpace = (neededSpace: number) => {
    const minSpaceRequired = 25 // Espacio mínimo requerido al final de página
    if (yPos + neededSpace > pageHeight - minSpaceRequired) {
      addNewPage()
    }
  }

  // Función para agregar sección con título
  const addSectionTitle = (titulo: string, forceNewPage: boolean = false) => {
    const titleSpace = 15
    if (forceNewPage) {
      addNewPage()
    } else {
      ensureSpace(titleSpace)
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(59, 130, 246)
    doc.text(titulo.toUpperCase(), marginLeft, yPos)
    
    // Línea bajo el título
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(0.5)
    doc.line(marginLeft, yPos + 2, pageWidth - marginLeft, yPos + 2)
    
    yPos += 10
  }

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

  // PORTADA
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(59, 130, 246)
  doc.text('REPORTE DE', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 12
  doc.setFontSize(24)
  doc.text('MIEMBROS', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 25

  // Fecha
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(100)
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Fecha de Generacion: ${fecha}`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 20

  // Línea decorativa
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(1)
  doc.line(marginLeft, yPos, pageWidth - marginLeft, yPos)
  yPos += 15

  // SECCIÓN 1: INDICADORES PRINCIPALES (KPIs)
  addSectionTitle('Indicadores Principales')
  
  const kpis = [
    { label: 'Total Miembros', valor: totalMiembros, color: [59, 130, 246] },
    { label: 'Miembros Activos', valor: miembrosActivos, color: [34, 197, 94] },
    { label: 'Total Comprometido', valor: `$${totalComprometido.toLocaleString('es-CO')}`, color: [251, 146, 60] },
    { label: 'Total Recaudado', valor: `$${totalPagado.toLocaleString('es-CO')}`, color: [168, 85, 247] }
  ]

  kpis.forEach((kpi) => {
    ensureSpace(16)
    // Fondo de color con esquinas redondeadas
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2])
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2])
    doc.roundedRect(marginLeft, yPos - 3, contentWidth, 11, 2, 2, 'FD')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(255)
    doc.text(kpi.label, marginLeft + 3, yPos + 2)

    // Valor
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(kpi.valor.toString(), pageWidth - marginLeft - 2, yPos + 2, { align: 'right' })

    yPos += 16
  })

  yPos += 5

  // SECCIÓN 2: MÉTRICAS OPERATIVAS
  addSectionTitle('Metricas Operativas')

  const metricasData = [
    ['Promedio Comprometido', `$${promedioComprometido.toLocaleString('es-CO')}`],
    ['Promedio Recaudado', `$${promedioPagado.toLocaleString('es-CO')}`],
    ['Total Pendiente', `$${totalPendiente.toLocaleString('es-CO')}`],
    ['Porcentaje Cumplimiento', `${porcentajeCumplimiento.toFixed(1)}%`],
    ['Miembros con Deuda', datos.filter(m => (m.total_pendiente || 0) > 0).length],
    ['Miembros al Día', datos.filter(m => (m.total_pendiente || 0) === 0).length]
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50)

  metricasData.forEach(([label, valor]) => {
    ensureSpace(9)
    doc.text(label.toString(), marginLeft + 2, yPos)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(valor.toString(), pageWidth - marginLeft - 2, yPos, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    yPos += 9
  })

  yPos += 5

  // SECCIÓN 3: TOP CONTRIBUYENTES
  if (topContribuyentes.length > 0) {
    addSectionTitle('Top Contribuyentes')

    // Calcular espacio necesario para la tabla completa
    const headerHeight = 8
    const rowHeight = 6
    const tableSpace = headerHeight + (topContribuyentes.slice(0, 8).length * rowHeight) + 5

    // Verificar si la tabla completa cabe, si no, forzar nueva página
    if (yPos + tableSpace > pageHeight - 25) {
      addNewPage()
      addSectionTitle('Top Contribuyentes', true)
    }

    // Tabla de contribuyentes
    const topData = topContribuyentes.slice(0, 8).map((m: any, idx: number) => [
      (idx + 1).toString(),
      m.nombre_completo.substring(0, 25),
      `$${m.total_comprometido.toLocaleString('es-CO')}`,
      `$${m.total_pagado.toLocaleString('es-CO')}`,
      `${m.total_pendiente > 0 ? m.total_pendiente.toLocaleString('es-CO') : '0'}`
    ])

    // Headers
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(255)
    doc.setFillColor(59, 130, 246)
    doc.rect(marginLeft, yPos - 4, contentWidth, 6, 'F')
    
    doc.text('#', marginLeft + 2, yPos + 1)
    doc.text('Nombre', marginLeft + 8, yPos + 1)
    doc.text('Comprometido', marginLeft + 60, yPos + 1)
    doc.text('Pagado', marginLeft + 90, yPos + 1)
    doc.text('Pendiente', pageWidth - marginLeft - 5, yPos + 1, { align: 'right' })
    
    yPos += 8

    // Filas de datos
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(50)

    topData.forEach((row: any, idx: number) => {
      // Verificar espacio para cada fila
      if (yPos + 8 > pageHeight - 20) {
        addNewPage()
        // Re-dibujar headers en nueva página
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.setTextColor(255)
        doc.setFillColor(59, 130, 246)
        doc.rect(marginLeft, yPos - 4, contentWidth, 6, 'F')
        
        doc.text('#', marginLeft + 2, yPos + 1)
        doc.text('Nombre', marginLeft + 8, yPos + 1)
        doc.text('Comprometido', marginLeft + 60, yPos + 1)
        doc.text('Pagado', marginLeft + 90, yPos + 1)
        doc.text('Pendiente', pageWidth - marginLeft - 5, yPos + 1, { align: 'right' })
        
        yPos += 8
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(50)
      }
      
      // Fondo alternado para mejor lectura
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245)
        doc.rect(marginLeft, yPos - 3, contentWidth, 5.5, 'F')
      }

      doc.text(row[0], marginLeft + 2, yPos)
      doc.text(row[1], marginLeft + 8, yPos)
      doc.text(row[2], marginLeft + 60, yPos)
      doc.text(row[3], marginLeft + 90, yPos)
      doc.text(row[4], pageWidth - marginLeft - 5, yPos, { align: 'right' })
      
      yPos += 6
    })
  }

  yPos += 5

  // SECCIÓN 4: TABLA DETALLADA DE MIEMBROS - Forzar nueva página para tabla grande
  addNewPage()
  addSectionTitle('Lista Detallada de Miembros', true)

  // Tabla con autoTable
  const tablaData = datos.map((miembro: any) => [
    miembro.nombre_completo,
    miembro.email,
    miembro.votos_activos || 0,
    `$${miembro.total_comprometido?.toLocaleString('es-CO') || 0}`,
    `$${miembro.total_pagado?.toLocaleString('es-CO') || 0}`,
    `$${miembro.total_pendiente?.toLocaleString('es-CO') || 0}`,
    miembro.estado || 'activo'
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Nombre', 'Email', 'Votos Activos', 'Comprometido', 'Pagado', 'Pendiente', 'Estado']],
    body: tablaData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer en cada página
      const pageCount = doc.getNumberOfPages()
      const pageNumber = doc.getCurrentPageInfo().pageNumber
      
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `Página ${pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }
  })

  // Footer en todas las páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150)
    
    const pageText = `Pagina ${i} de ${totalPages}`
    const dateText = new Date().toLocaleDateString('es-CO')
    
    doc.text(pageText, marginLeft, pageHeight - 10)
    doc.text('IPUC Contabilidad - Reporte de Miembros', pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.text(dateText, pageWidth - marginLeft, pageHeight - 10, { align: 'right' })
  }

  doc.save(`Reporte_Miembros_Avanzado_${new Date().getTime()}.pdf`)
  
  return { success: true, mensaje: 'PDF avanzado de miembros generado exitosamente' }
}

// Función específica para reporte avanzado de votos
export const generarPDFVotos = (datos: any[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 15
  const marginLeft = 14
  const marginRight = 14
  const contentWidth = pageWidth - (marginLeft + marginRight)

  // Función para agregar nueva página con header
  const addNewPage = () => {
    doc.addPage()
    yPos = 20 // Más espacio al inicio para evitar cortes
    // Header de nueva página
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text('REPORTE DE VOTOS - IPUC CONTABILIDAD', pageWidth / 2, 12, { align: 'center' })
  }

  // Función mejorada para verificar si necesita nueva página
  const ensureSpace = (neededSpace: number) => {
    const minSpaceRequired = 25 // Espacio mínimo requerido al final de página
    if (yPos + neededSpace > pageHeight - minSpaceRequired) {
      addNewPage()
    }
  }

  // Función para agregar sección con título
  const addSectionTitle = (titulo: string, forceNewPage: boolean = false) => {
    const titleSpace = 15
    if (forceNewPage) {
      addNewPage()
    } else {
      ensureSpace(titleSpace)
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(59, 130, 246)
    doc.text(titulo.toUpperCase(), marginLeft, yPos)
    
    // Línea bajo el título
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(0.5)
    doc.line(marginLeft, yPos + 2, pageWidth - marginLeft, yPos + 2)
    
    yPos += 10
  }

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

  // PORTADA
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(59, 130, 246)
  doc.text('REPORTE DE', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 12
  doc.setFontSize(24)
  doc.text('VOTOS', pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 25

  // Fecha
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(100)
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  doc.text(`Fecha de Generacion: ${fecha}`, pageWidth / 2, yPos, { align: 'center' })
  
  yPos += 20

  // Línea decorativa
  doc.setDrawColor(59, 130, 246)
  doc.setLineWidth(1)
  doc.line(marginLeft, yPos, pageWidth - marginLeft, yPos)
  yPos += 15

  // SECCIÓN 1: INDICADORES PRINCIPALES (KPIs)
  addSectionTitle('Indicadores Principales')
  
  const kpis = [
    { label: 'Total de Votos', valor: totalVotos, color: [59, 130, 246] },
    { label: 'Votos Activos', valor: votosActivos, color: [34, 197, 94] },
    { label: 'Votos Completados', valor: votosCompletados, color: [251, 146, 60] },
    { label: 'Total Comprometido', valor: `$${totalComprometido.toLocaleString('es-CO')}`, color: [168, 85, 247] }
  ]

  kpis.forEach((kpi) => {
    ensureSpace(16)
    // Fondo de color con esquinas redondeadas
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2])
    doc.setDrawColor(kpi.color[0], kpi.color[1], kpi.color[2])
    doc.roundedRect(marginLeft, yPos - 3, contentWidth, 11, 2, 2, 'FD')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(255)
    doc.text(kpi.label, marginLeft + 3, yPos + 2)

    // Valor
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(kpi.valor.toString(), pageWidth - marginLeft - 2, yPos + 2, { align: 'right' })

    yPos += 16
  })

  yPos += 5

  // SECCIÓN 2: MÉTRICAS OPERATIVAS
  addSectionTitle('Metricas Operativas')

  const metricasData = [
    ['Promedio por Voto', `$${promedioVoto.toLocaleString('es-CO')}`],
    ['Total Recaudado', `$${totalRecaudado.toLocaleString('es-CO')}`],
    ['Total Pendiente', `$${totalPendiente.toLocaleString('es-CO')}`],
    ['Porcentaje Cumplimiento', `${porcentajeCumplimiento.toFixed(1)}%`],
    ['Votos Vencidos', votosVencidos],
    ['Propositos Diferentes', analisisPropositos.length]
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50)

  metricasData.forEach(([label, valor]) => {
    ensureSpace(9)
    doc.text(label.toString(), marginLeft + 2, yPos)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(valor.toString(), pageWidth - marginLeft - 2, yPos, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    yPos += 9
  })

  yPos += 5

  // SECCIÓN 3: ESTADO DE VOTOS
  addSectionTitle('Estado de Votos')

  const estadoVotos = [
    ['Votos Activos', votosActivos, votosActivos / totalVotos],
    ['Votos Completados', votosCompletados, votosCompletados / totalVotos],
    ['Votos Vencidos', votosVencidos, votosVencidos / totalVotos]
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50)

  estadoVotos.forEach(([label, cantidad, porcentaje]) => {
    ensureSpace(14)
    doc.text(label.toString(), marginLeft + 2, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(cantidad.toString(), marginLeft + 60, yPos)
    
    // Barra de progreso
    const barWidth = contentWidth - 80
    const progress = porcentaje as number
    
    // Fondo de barra
    doc.setDrawColor(200)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft + 70, yPos - 1, barWidth, 4)
    
    // Barra de progreso
    doc.setFillColor(59, 130, 246)
    doc.rect(marginLeft + 70, yPos - 1, barWidth * progress, 4, 'F')
    
    // Porcentaje
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(59, 130, 246)
    doc.text(`${(porcentaje as number * 100).toFixed(1)}%`, marginLeft + 70 + barWidth + 5, yPos + 1)
    
    yPos += 10
  })

  yPos += 5

  // SECCIÓN 4: ANÁLISIS POR PROPÓSITOS
  if (analisisPropositos.length > 0) {
    addSectionTitle('Analisis por Propositos')

    // Calcular espacio necesario para cada propósito (12 unidades cada uno)
    const propositoSpace = 12
    const propositosToShow = analisisPropositos.slice(0, 6)
    const totalSpaceNeeded = propositosToShow.length * propositoSpace

    // Si no cabe todo, mostrar menos propósitos por página
    let propositosPorPagina = propositosToShow.length
    if (yPos + totalSpaceNeeded > pageHeight - 25) {
      propositosPorPagina = Math.floor((pageHeight - yPos - 25) / propositoSpace)
      if (propositosPorPagina < 1) {
        addNewPage()
        propositosPorPagina = Math.floor((pageHeight - yPos - 25) / propositoSpace)
      }
    }

    propositosToShow.slice(0, propositosPorPagina).forEach((prop: any) => {
      // Verificar espacio para cada propósito individualmente
      if (yPos + 12 > pageHeight - 20) {
        addNewPage()
      }

      // Nombre del propósito
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(31, 41, 55)
      doc.text(prop.nombre.substring(0, 35), marginLeft, yPos)
      yPos += 5

      // Barra de progreso
      const barWidth = contentWidth - 40
      const progress = Math.min(prop.porcentaje_avance / 100, 1)
      
      // Fondo de barra
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.rect(marginLeft, yPos - 1, barWidth, 4)
      
      // Barra de progreso
      doc.setFillColor(59, 130, 246)
      doc.rect(marginLeft, yPos - 1, barWidth * progress, 4, 'F')
      
      // Porcentaje
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(59, 130, 246)
      doc.text(`${prop.porcentaje_avance.toFixed(1)}%`, marginLeft + barWidth + 5, yPos + 1)
      
      yPos += 6

      // Información adicional
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(
        `${prop.votos_count} votos | Recaudado: $${prop.total_recaudado.toLocaleString('es-CO')}`,
        marginLeft,
        yPos
      )
      yPos += 4
    })

    // Si hay más propósitos que no cupieron, indicar que hay más
    if (propositosToShow.length > propositosPorPagina) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`... y ${propositosToShow.length - propositosPorPagina} propósitos más`, marginLeft, yPos)
      yPos += 5
    }
  }

  yPos += 5

  // SECCIÓN 5: LISTA DETALLADA DE VOTOS - Forzar nueva página para tabla grande
  addNewPage()
  addSectionTitle('Lista Detallada de Votos', true)

  // Tabla con autoTable
  const tablaData = datos.map((voto: any) => [
    voto.proposito || 'Sin propósito',
    voto.miembro_nombre,
    `$${voto.monto_total?.toLocaleString('es-CO') || 0}`,
    `$${voto.recaudado?.toLocaleString('es-CO') || 0}`,
    `$${voto.pendiente?.toLocaleString('es-CO') || 0}`,
    voto.estado || 'activo',
    voto.fecha_limite
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Propósito', 'Miembro', 'Monto Total', 'Recaudado', 'Pendiente', 'Estado', 'Fecha Límite']],
    body: tablaData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      textColor: 50
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer en cada página
      const pageCount = doc.getNumberOfPages()
      const pageNumber = doc.getCurrentPageInfo().pageNumber
      
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(
        `Página ${pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }
  })

  // Footer en todas las páginas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150)
    
    const pageText = `Pagina ${i} de ${totalPages}`
    const dateText = new Date().toLocaleDateString('es-CO')
    
    doc.text(pageText, marginLeft, pageHeight - 10)
    doc.text('IPUC Contabilidad - Reporte de Votos', pageWidth / 2, pageHeight - 10, { align: 'center' })
    doc.text(dateText, pageWidth - marginLeft, pageHeight - 10, { align: 'right' })
  }

  doc.save(`Reporte_Votos_Avanzado_${new Date().getTime()}.pdf`)
  
  return { success: true, mensaje: 'PDF avanzado de votos generado exitosamente' }
}
