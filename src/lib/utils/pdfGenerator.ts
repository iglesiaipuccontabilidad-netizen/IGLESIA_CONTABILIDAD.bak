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

// Función específica para reporte de votos
export const generarPDFVotos = (datos: any[]) => {
  return generarPDF({
    titulo: 'Reporte General de Votos',
    subtitulo: `Total de votos: ${datos.length}`,
    columnas: [
      { header: 'Miembro', dataKey: 'miembro_nombre' },
      { header: 'Propósito', dataKey: 'proposito' },
      { header: 'Monto Total', dataKey: 'monto_total' },
      { header: 'Recaudado', dataKey: 'recaudado' },
      { header: 'Pendiente', dataKey: 'pendiente' },
      { header: 'Estado', dataKey: 'estado' }
    ],
    datos,
    orientacion: 'landscape'
  })
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

// Función específica para reporte de miembros
export const generarPDFMiembros = (datos: any[]) => {
  return generarPDF({
    titulo: 'Reporte de Miembros',
    subtitulo: `Total de miembros: ${datos.length}`,
    columnas: [
      { header: 'Nombre', dataKey: 'nombre_completo' },
      { header: 'Email', dataKey: 'email' },
      { header: 'Votos Activos', dataKey: 'votos_activos' },
      { header: 'Comprometido', dataKey: 'total_comprometido' },
      { header: 'Pagado', dataKey: 'total_pagado' },
      { header: 'Pendiente', dataKey: 'total_pendiente' }
    ],
    datos,
    orientacion: 'landscape'
  })
}

// Función específica para reporte financiero
export const generarPDFFinanciero = (datos: any) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  // Título
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('Reporte Financiero Consolidado', 14, 20)

  // Fecha
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  const fecha = new Date().toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  doc.text(`Fecha: ${fecha}`, 14, 28)

  // Línea separadora
  doc.setDrawColor(200)
  doc.line(14, 32, doc.internal.pageSize.getWidth() - 14, 32)

  let yPos = 42

  // Sección de totales
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(50)
  doc.text('Resumen Financiero', 14, yPos)
  yPos += 10

  const metricas = [
    { label: 'Total Comprometido', valor: datos.total_comprometido, color: [59, 130, 246] },
    { label: 'Total Recaudado', valor: datos.total_recaudado, color: [34, 197, 94] },
    { label: 'Total Pendiente', valor: datos.total_pendiente, color: [251, 146, 60] },
    { label: 'Promedio por Miembro', valor: datos.promedio_por_miembro, color: [168, 85, 247] }
  ]

  metricas.forEach((metrica, index) => {
    // Fondo de color
    doc.setFillColor(metrica.color[0], metrica.color[1], metrica.color[2])
    doc.setDrawColor(metrica.color[0], metrica.color[1], metrica.color[2])
    doc.roundedRect(14, yPos, doc.internal.pageSize.getWidth() - 28, 15, 2, 2, 'FD')

    // Texto
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(255)
    doc.text(metrica.label, 18, yPos + 6)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(`$${metrica.valor.toLocaleString('es-CO')}`, 18, yPos + 12)

    yPos += 20
  })

  // Sección de votos
  yPos += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(50)
  doc.text('Estado de Votos', 14, yPos)
  yPos += 10

  const estadoVotos = [
    { label: 'Votos Activos', valor: datos.votos_activos, color: [59, 130, 246] },
    { label: 'Votos Completados', valor: datos.votos_completados, color: [34, 197, 94] },
    { label: 'Votos Vencidos', valor: datos.votos_vencidos, color: [239, 68, 68] }
  ]

  estadoVotos.forEach((estado) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(50)
    doc.text(estado.label, 18, yPos)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(estado.color[0], estado.color[1], estado.color[2])
    doc.text(estado.valor.toString(), doc.internal.pageSize.getWidth() - 30, yPos, { align: 'right' })

    yPos += 8
  })

  // Información adicional
  yPos += 15
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(150)
  doc.text(`Total de Miembros Activos: ${datos.total_miembros_activos}`, 14, yPos)

  // Footer
  doc.setFontSize(8)
  doc.text(
    'IPUC Contabilidad - Sistema de Gestión',
    doc.internal.pageSize.getWidth() / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  )

  // Descargar
  doc.save(`Reporte_Financiero_${new Date().getTime()}.pdf`)

  return { success: true, mensaje: 'PDF generado exitosamente' }
}
