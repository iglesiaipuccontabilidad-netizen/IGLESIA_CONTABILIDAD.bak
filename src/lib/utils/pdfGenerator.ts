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
  incluirLogo?: boolean
  colorTema?: string
  incluirResumen?: boolean
}

interface PDFConfig {
  incluirLogo: boolean
  colorTema: string
  incluirResumen: boolean
  orientacion: 'portrait' | 'landscape'
  formato: 'a4' | 'letter'
}

// Función auxiliar para convertir color hex a RGB
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [59, 130, 246] // Color por defecto (blue-500)
}

export const generarPDF = ({ 
  titulo, 
  subtitulo, 
  columnas, 
  datos, 
  orientacion = 'portrait',
  incluirLogo = true,
  colorTema = '#3B82F6',
  incluirResumen = true
}: PDFOptions) => {
  try {
    // Crear documento PDF
    const doc = new jsPDF({
      orientation: orientacion,
      unit: 'mm',
      format: 'a4'
    })

    let yPos = 20

    // Logo y encabezado mejorado
    if (incluirLogo) {
      // Dibujar logo simple (círculo con iniciales)
      doc.setFillColor(colorTema)
      doc.circle(20, 15, 8, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.text('IPUC', 20, 17, { align: 'center' })
      
      yPos = 35
    }

    // Configurar fuentes
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(colorTema)

    // Título principal
    doc.text(titulo, incluirLogo ? 35 : 14, yPos)

    yPos += 8

    // Subtítulo (si existe)
    if (subtitulo) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(100)
      doc.text(subtitulo, incluirLogo ? 35 : 14, yPos)
      yPos += 6
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
    doc.text(`Generado: ${fecha}`, incluirLogo ? 35 : 14, yPos)
    doc.text('Sistema Contable IPUC', doc.internal.pageSize.getWidth() - 14, yPos, { align: 'right' })

    yPos += 6

    // Línea separadora
    doc.setDrawColor(colorTema)
    doc.setLineWidth(0.5)
    doc.line(incluirLogo ? 35 : 14, yPos, doc.internal.pageSize.getWidth() - 14, yPos)

    yPos += 6

    // Tabla con datos
    autoTable(doc, {
      startY: yPos,
      head: [columnas.map(col => col.header)],
      body: datos.map(row => columnas.map(col => {
        const value = row[col.dataKey]
        // Formatear números como moneda si es necesario
        if (typeof value === 'number' && (col.dataKey.includes('monto') || col.dataKey.includes('total') || col.dataKey.includes('pagado') || col.dataKey.includes('pendiente') || col.dataKey.includes('comprometido'))) {
          return `$${value.toLocaleString('es-CO')}`
        }
        return value || '-'
      })),
      theme: 'striped',
      headStyles: {
        fillColor: colorTema,
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
      margin: { left: incluirLogo ? 35 : 14, right: 14 },
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

    // Resumen al final (si hay datos numéricos y está habilitado)
    const hasNumericData = columnas.some(col => 
      col.dataKey.includes('monto') || 
      col.dataKey.includes('total') || 
      col.dataKey.includes('pagado') || 
      col.dataKey.includes('pendiente')
    )

    if (incluirResumen && hasNumericData && datos.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 10
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(colorTema)
      doc.text('Resumen:', incluirLogo ? 35 : 14, finalY)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(50)
      doc.text(`Total de registros: ${datos.length}`, incluirLogo ? 35 : 14, finalY + 6)
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
export const generarPDFFinanciero = (datos: any, config: Partial<PDFConfig> = {}) => {
  const {
    incluirLogo = true,
    colorTema = '#3B82F6',
    incluirResumen = true,
    orientacion = 'portrait',
    formato = 'a4'
  } = config

  const doc = new jsPDF({
    orientation: orientacion,
    unit: 'mm',
    format: formato
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
    doc.setTextColor(hexToRgb(colorTema)[0], hexToRgb(colorTema)[1], hexToRgb(colorTema)[2])
    doc.text(titulo.toUpperCase(), marginLeft, yPos)

    // Línea bajo el título
    doc.setDrawColor(hexToRgb(colorTema)[0], hexToRgb(colorTema)[1], hexToRgb(colorTema)[2])
    doc.setLineWidth(0.5)
    doc.line(marginLeft, yPos + 2, pageWidth - marginLeft, yPos + 2)

    yPos += 12
  }

  // PORTADA
  if (incluirLogo) {
    // Logo en la portada
    doc.setFillColor(hexToRgb(colorTema)[0], hexToRgb(colorTema)[1], hexToRgb(colorTema)[2])
    doc.circle(pageWidth / 2, yPos + 8, 12, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text('IPUC', pageWidth / 2, yPos + 12, { align: 'center' })
    
    yPos += 25
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(hexToRgb(colorTema)[0], hexToRgb(colorTema)[1], hexToRgb(colorTema)[2])
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
  doc.setDrawColor(hexToRgb(colorTema)[0], hexToRgb(colorTema)[1], hexToRgb(colorTema)[2])
  doc.setLineWidth(1)
  doc.line(marginLeft, yPos, pageWidth - marginLeft, yPos)
  yPos += 15

  // SECCIÓN 1: INDICADORES PRINCIPALES (KPIs)
  if (incluirResumen) {
    addSectionTitle('Indicadores Principales')

    const kpis = [
      { label: 'Total Comprometido', valor: datos.total_comprometido, color: hexToRgb(colorTema) },
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
  }
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
    doc.setFillColor(hexToRgb(colorTema)[0], hexToRgb(colorTema)[1], hexToRgb(colorTema)[2])
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
        doc.setFillColor(hexToRgb(colorTema)[0], hexToRgb(colorTema)[1], hexToRgb(colorTema)[2])
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
      doc.setFillColor(hexToRgb(colorTema)[0], hexToRgb(colorTema)[1], hexToRgb(colorTema)[2])
      doc.rect(marginLeft, yPos - 1, barWidth * progress, 4, 'F')
      
      // Porcentaje
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(hexToRgb(colorTema)[0], hexToRgb(colorTema)[1], hexToRgb(colorTema)[2])
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
export const generarPDFPagos = (datos: any[], config: Partial<PDFConfig> = {}) => {
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
    ...config
  })
}

// Función específica para reporte avanzado de miembros
export const generarPDFMiembros = (datos: any[], config: Partial<PDFConfig> = {}) => {
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
export const generarPDFVotos = (datos: any[], config: Partial<PDFConfig> = {}) => {
  const {
    incluirLogo = true,
    colorTema = '#3B82F6',
    incluirResumen = true,
    orientacion = 'portrait',
    formato = 'a4'
  } = config
  const doc = new jsPDF({
    orientation: orientacion,
    unit: 'mm',
    format: formato
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
      // Asegurar que hay suficiente espacio después de la nueva página
      if (yPos + neededSpace > pageHeight - minSpaceRequired) {
        // Si aún no hay espacio suficiente, forzar otra página
        addNewPage()
      }
    }
  }

  // Función para agregar sección con título
  const addSectionTitle = (titulo: string, forceNewPage: boolean = false) => {
    const titleSpace = 15
    if (forceNewPage || yPos + titleSpace > pageHeight - 25) {
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

  // Función para verificar si una tabla cabe en la página actual
  const canFitTable = (estimatedRows: number, rowHeight: number = 8) => {
    const availableSpace = pageHeight - yPos - 25 // 25px de margen inferior
    const neededSpace = estimatedRows * rowHeight
    return availableSpace >= neededSpace
  }

  // Función para agregar espacio entre secciones
  const addSectionSpacing = (spacing: number = 5) => {
    yPos += spacing
    // Si el espaciado hace que nos acerquemos al final, verificar espacio
    if (yPos > pageHeight - 30) {
      addNewPage()
    }
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

  // Calcular métricas adicionales importantes
  const hoy = new Date()
  const proximos7Dias = new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)
  const votosProximosVencer = datos.filter(v => {
    if (!v.fecha_limite || v.estado !== 'activo') return false
    const fechaLimite = new Date(v.fecha_limite)
    return fechaLimite >= hoy && fechaLimite <= proximos7Dias
  }).length

  const votosMayorRecaudacion = datos
    .filter(v => v.recaudado > 0)
    .sort((a, b) => b.recaudado - a.recaudado)
    .slice(0, 5)

  const votosMayorPendiente = datos
    .filter(v => (v.monto_total - v.recaudado) > 0)
    .sort((a, b) => (b.monto_total - b.recaudado) - (a.monto_total - a.recaudado))
    .slice(0, 5)

  // Distribución por rangos de montos
  const rangosMontos = {
    pequenos: datos.filter(v => (v.monto_total || 0) < 500000).length,
    medianos: datos.filter(v => (v.monto_total || 0) >= 500000 && (v.monto_total || 0) < 2000000).length,
    grandes: datos.filter(v => (v.monto_total || 0) >= 2000000).length
  }

  // Agrupar por propósito con más detalles
  const propositosMap = new Map()
  datos.forEach(voto => {
    const prop = voto.proposito || 'Sin propósito'
    if (!propositosMap.has(prop)) {
      propositosMap.set(prop, { 
        count: 0, 
        comprometido: 0, 
        recaudado: 0,
        miembros: new Set(),
        completados: 0,
        activos: 0,
        vencidos: 0
      })
    }
    const data = propositosMap.get(prop)
    data.count++
    data.comprometido += voto.monto_total || 0
    data.recaudado += voto.recaudado || 0
    data.miembros.add(voto.miembro_nombre)
    if (voto.estado === 'completado') data.completados++
    if (voto.estado === 'activo') data.activos++
    if (voto.estado === 'vencido') data.vencidos++
  })
  const analisisPropositos = Array.from(propositosMap.entries()).map(([nombre, data]) => ({
    nombre,
    votos_count: data.count,
    miembros_unicos: data.miembros.size,
    total_comprometido: data.comprometido,
    total_recaudado: data.recaudado,
    porcentaje_avance: data.comprometido > 0 ? (data.recaudado / data.comprometido) * 100 : 0,
    completados: data.completados,
    activos: data.activos,
    vencidos: data.vencidos
  })).sort((a, b) => b.total_comprometido - a.total_comprometido)

  // PORTADA
  if (incluirLogo) {
    // Logo
    doc.setFillColor(colorTema)
    doc.circle(pageWidth / 2, 25, 12, 'F')
    
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(255, 255, 255)
    doc.text('IPUC', pageWidth / 2, 28, { align: 'center' })
    
    yPos = 50
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(colorTema)
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
    { label: 'Votos Vencidos', valor: votosVencidos, color: [239, 68, 68] },
    { label: 'Próximos a Vencer (7 días)', valor: votosProximosVencer, color: [245, 158, 11] },
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

  addSectionSpacing(5)

  // SECCIÓN 2: VOTOS PRÓXIMOS A VENCER (Información Crítica)
  if (votosProximosVencer > 0) {
    addSectionTitle('Votos Proximos a Vencer (7 dias)')

    const votosUrgentes = datos
      .filter(v => {
        if (!v.fecha_limite || v.estado !== 'activo') return false
        const fechaLimite = new Date(v.fecha_limite)
        return fechaLimite >= hoy && fechaLimite <= proximos7Dias
      })
      .sort((a, b) => new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime())
      .slice(0, 5)

    votosUrgentes.forEach((voto, idx) => {
      ensureSpace(12)
      
      // Fondo de alerta
      doc.setFillColor(255, 243, 224)
      doc.setDrawColor(251, 146, 60)
      doc.setLineWidth(0.5)
      doc.roundedRect(marginLeft, yPos - 2, contentWidth, 10, 1, 1, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(31, 41, 55)
      doc.text(`${idx + 1}. ${voto.proposito || 'Sin propósito'}`, marginLeft + 3, yPos + 3)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100)
      const diasRestantes = Math.ceil((new Date(voto.fecha_limite).getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      doc.text(
        `${voto.miembro_nombre} | $${((voto.monto_total || 0) - (voto.recaudado || 0)).toLocaleString('es-CO')} pendiente | Vence en ${diasRestantes} días`,
        marginLeft + 3,
        yPos + 7
      )
      
      yPos += 12
    })

    addSectionSpacing(5)
  }

  // SECCIÓN 3: DISTRIBUCIÓN POR RANGOS DE MONTOS
  addSectionTitle('Distribucion por Rangos de Montos')

  const distribucionMontos = [
    [`Votos Pequeños (< $500K)`, rangosMontos.pequenos, rangosMontos.pequenos / totalVotos],
    [`Votos Medianos ($500K - $2M)`, rangosMontos.medianos, rangosMontos.medianos / totalVotos],
    [`Votos Grandes (> $2M)`, rangosMontos.grandes, rangosMontos.grandes / totalVotos]
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50)

  distribucionMontos.forEach(([label, cantidad, porcentaje]) => {
    ensureSpace(14)
    doc.text(label.toString(), marginLeft + 2, yPos)
    doc.setFont('helvetica', 'bold')
    doc.text(cantidad.toString(), marginLeft + 80, yPos)
    
    // Barra de progreso
    const barWidth = contentWidth - 100
    const progress = porcentaje as number
    
    // Fondo de barra
    doc.setDrawColor(200)
    doc.setLineWidth(0.3)
    doc.rect(marginLeft + 90, yPos - 1, barWidth, 4)
    
    // Barra de progreso
    doc.setFillColor(59, 130, 246)
    doc.rect(marginLeft + 90, yPos - 1, barWidth * progress, 4, 'F')
    
    // Porcentaje
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(59, 130, 246)
    doc.text(`${(porcentaje as number * 100).toFixed(1)}%`, marginLeft + 90 + barWidth + 5, yPos + 1)
    
    yPos += 10
  })

  addSectionSpacing(5)

  // SECCIÓN 4: ESTADO DE VOTOS
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

  addSectionSpacing(5)

  // SECCIÓN 5: ANÁLISIS POR PROPÓSITOS
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

      // Información adicional más detallada
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(
        `${prop.votos_count} votos | ${prop.miembros_unicos} miembros | Recaudado: $${prop.total_recaudado.toLocaleString('es-CO')} | ${prop.completados} completados`,
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

  addSectionSpacing(5)

  // SECCIÓN 6: TOP VOTOS POR RECAUDACIÓN
  if (votosMayorRecaudacion.length > 0) {
    addSectionTitle('Top Votos por Recaudacion')

    votosMayorRecaudacion.forEach((voto, idx) => {
      ensureSpace(10)
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(34, 197, 94)
      doc.text(`${idx + 1}.`, marginLeft + 2, yPos + 2)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(31, 41, 55)
      doc.text(voto.proposito || 'Sin propósito', marginLeft + 10, yPos + 2)
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(34, 197, 94)
      doc.text(`$${voto.recaudado.toLocaleString('es-CO')}`, pageWidth - marginLeft - 2, yPos + 2, { align: 'right' })
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(`${voto.miembro_nombre} | ${voto.estado}`, marginLeft + 10, yPos + 6)
      
      yPos += 10
    })

    addSectionSpacing(5)
  }

  // SECCIÓN 7: VOTOS CON MAYOR PENDIENTE
  if (votosMayorPendiente.length > 0) {
    addSectionTitle('Votos con Mayor Pendiente')

    votosMayorPendiente.forEach((voto, idx) => {
      ensureSpace(10)
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(239, 68, 68)
      doc.text(`${idx + 1}.`, marginLeft + 2, yPos + 2)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(31, 41, 55)
      doc.text(voto.proposito || 'Sin propósito', marginLeft + 10, yPos + 2)
      
      const pendiente = (voto.monto_total || 0) - (voto.recaudado || 0)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(239, 68, 68)
      doc.text(`$${pendiente.toLocaleString('es-CO')}`, pageWidth - marginLeft - 2, yPos + 2, { align: 'right' })
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(`${voto.miembro_nombre} | ${voto.estado}`, marginLeft + 10, yPos + 6)
      
      yPos += 10
    })

    addSectionSpacing(5)
  }

  // SECCIÓN 8: MÉTRICAS OPERATIVAS (Detalles Adicionales)
  addSectionTitle('Metricas Operativas Detalladas')

  const metricasData = [
    ['Promedio por Voto', `$${promedioVoto.toLocaleString('es-CO')}`],
    ['Total Recaudado', `$${totalRecaudado.toLocaleString('es-CO')}`],
    ['Total Pendiente', `$${totalPendiente.toLocaleString('es-CO')}`],
    ['Porcentaje Cumplimiento General', `${porcentajeCumplimiento.toFixed(1)}%`],
    ['Votos Vencidos', votosVencidos],
    ['Propositos Diferentes', analisisPropositos.length],
    ['Miembros Participantes', new Set(datos.map(v => v.miembro_nombre)).size],
    ['Votos con Mayor Recaudación', votosMayorRecaudacion.length]
  ]

  // Verificar si las métricas caben en la página actual
  if (!canFitTable(metricasData.length, 9)) {
    addNewPage()
  }

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

  addSectionSpacing(5)

  // SECCIÓN 9: LISTA DETALLADA DE VOTOS - Forzar nueva página para tabla grande
  addNewPage()
  addSectionTitle('Lista Detallada de Votos', true)

  // Tabla con autoTable mejorada
  const tablaData = datos.map((voto: any) => {
    const pendiente = (voto.monto_total || 0) - (voto.recaudado || 0)
    const porcentajeIndividual = voto.monto_total > 0 ? ((voto.recaudado || 0) / voto.monto_total) * 100 : 0
    
    return [
      voto.proposito || 'Sin propósito',
      voto.miembro_nombre,
      `$${voto.monto_total?.toLocaleString('es-CO') || 0}`,
      `$${voto.recaudado?.toLocaleString('es-CO') || 0}`,
      `$${pendiente.toLocaleString('es-CO')}`,
      `${porcentajeIndividual.toFixed(1)}%`,
      voto.estado || 'activo',
      voto.fecha_limite ? new Date(voto.fecha_limite).toLocaleDateString('es-CO') : 'Sin fecha'
    ]
  })

  autoTable(doc, {
    startY: yPos,
    head: [['Propósito', 'Miembro', 'Monto Total', 'Recaudado', 'Pendiente', '% Cumpl.', 'Estado', 'Fecha Límite']],
    body: tablaData,
    theme: 'striped',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7,
      textColor: 50
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    columnStyles: {
      0: { cellWidth: 35 }, // Propósito
      1: { cellWidth: 30 }, // Miembro
      2: { halign: 'right' }, // Monto Total
      3: { halign: 'right' }, // Recaudado
      4: { halign: 'right' }, // Pendiente
      5: { halign: 'center' }, // % Cumplimiento
      6: { halign: 'center' }, // Estado
      7: { halign: 'center', cellWidth: 25 } // Fecha Límite
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

// ============================================================
// EXPORTACIÓN: Reporte de Ventas por Producto
// ============================================================
export const generarPDFVentas = (datos: any[], config: Partial<PDFConfig> = {}) => {
  if (!datos || datos.length === 0) {
    return { success: false, mensaje: 'No hay datos de ventas para exportar' }
  }

  try {
    const {
      incluirLogo = true,
      colorTema = '#3B82F6',
      incluirResumen = true,
      orientacion = 'landscape',
      formato = 'a4'
    } = config

    const doc = new jsPDF({
      orientation: orientacion,
      unit: 'mm',
      format: formato
    })

    // Configuración
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const marginLeft = 14
    const marginRight = 14
    const contentWidth = pageWidth - marginLeft - marginRight

    let yPos = 20

    // Logo y encabezado mejorado
    if (incluirLogo) {
      // Dibujar logo simple (círculo con iniciales)
      doc.setFillColor(colorTema)
      doc.circle(marginLeft + 8, yPos + 8, 8, 'F')
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(255, 255, 255)
      doc.text('IPUC', marginLeft + 8, yPos + 12, { align: 'center' })
      
      // Título
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(31, 41, 55)
      doc.text('Reporte de Ventas por Producto', marginLeft + 25, yPos + 8)
    } else {
      // Header sin logo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(31, 41, 55)
      doc.text('Reporte de Ventas por Producto', marginLeft, yPos + 8)
    }

    // Subtítulo
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
    doc.text(`Generado: ${fecha}`, marginLeft, yPos + 18)
    doc.text('IPUC Contabilidad', pageWidth - marginRight, yPos + 18, { align: 'right' })

    // Línea separadora
    doc.setDrawColor(200)
    doc.line(marginLeft, yPos + 22, pageWidth - marginRight, yPos + 22)

    yPos += 30

    // Calcular totales
    const totalUnidades = datos.reduce((sum, p) => sum + (p.unidades_vendidas || 0), 0)
    const totalRecaudado = datos.reduce((sum, p) => sum + (p.total_recaudado || 0), 0)
    const totalPendiente = datos.reduce((sum, p) => sum + (p.total_pendiente || 0), 0)
    const totalVentas = datos.reduce((sum, p) => sum + (p.cantidad_ventas || 0), 0)

    // Resumen ejecutivo en cards (solo si incluirResumen es true)
    if (incluirResumen) {
      const cardWidth = (contentWidth - 10) / 4
      const cardHeight = 20

      const cards = [
        { label: 'Productos', value: datos.length.toString(), color: hexToRgb(colorTema) },
        { label: 'Unidades Vendidas', value: totalUnidades.toString(), color: [16, 185, 129] },
        { label: 'Total Recaudado', value: `$${totalRecaudado.toLocaleString('es-CO')}`, color: [34, 197, 94] },
        { label: 'Pendiente', value: `$${totalPendiente.toLocaleString('es-CO')}`, color: [251, 146, 60] }
      ]

      cards.forEach((card, index) => {
        const xPos = marginLeft + (cardWidth + 2.5) * index
        
        // Fondo del card
        doc.setFillColor(card.color[0], card.color[1], card.color[2])
        doc.roundedRect(xPos, yPos, cardWidth, cardHeight, 2, 2, 'F')
        
        // Label
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(255, 255, 255)
        doc.text(card.label, xPos + cardWidth / 2, yPos + 8, { align: 'center' })
        
        // Value
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(12)
        doc.text(card.value, xPos + cardWidth / 2, yPos + 15, { align: 'center' })
      })

      yPos += cardHeight + 10
    }

    // Tabla de ventas por producto
    autoTable(doc, {
      startY: yPos,
      head: [['Producto', 'Precio Unit.', 'Unidades', 'Ventas', 'Recaudado', 'Pendiente', 'Estado']],
      body: datos.map(producto => [
        producto.producto_nombre,
        `$${producto.producto_precio?.toLocaleString('es-CO') || 0}`,
        producto.unidades_vendidas || 0,
        producto.cantidad_ventas || 0,
        `$${producto.total_recaudado?.toLocaleString('es-CO') || 0}`,
        `$${producto.total_pendiente?.toLocaleString('es-CO') || 0}`,
        producto.estado === 'activo' ? 'Activo' : 'Inactivo'
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: hexToRgb(colorTema),
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
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: 'right' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'center' }
      },
      margin: { left: marginLeft, right: marginRight },
      didDrawPage: (data) => {
        // Footer en cada página
        const pageCount = doc.getNumberOfPages()
        const pageNumber = doc.getCurrentPageInfo().pageNumber
        
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(
          `Página ${pageNumber} de ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
      }
    })

    doc.save(`Reporte_Ventas_Productos_${new Date().getTime()}.pdf`)
    
    return { success: true, mensaje: 'PDF de ventas generado exitosamente' }
  } catch (error) {
    console.error('Error al generar PDF de ventas:', error)
    return { success: false, mensaje: 'Error al generar el PDF' }
  }
}
