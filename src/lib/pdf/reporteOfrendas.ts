import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface Ofrenda {
  id: string
  fecha: string
  tipo: string
  monto: number
  concepto?: string
  proyecto_nombre?: string
}

interface ReportConfig {
  titulo?: string
  subtitulo?: string
  fecha?: Date
  logoUrl?: string
  incluirGrafico?: boolean
}

/**
 * Genera un PDF profesional con reporte de ofrendas
 */
export function generarReportePDF(
  ofrendas: Ofrenda[],
  nombreComite: string,
  config?: ReportConfig
) {
  const {
    titulo = 'REPORTE DE OFRENDAS',
    subtitulo,
    fecha = new Date(),
  } = config || {}

  // Crear documento PDF
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Variables para posición
  let yPosition = 20

  // Colores - tipados como tuplas
  const colorPrimario: [number, number, number] = [41, 128, 185] // Azul
  const colorSecundario: [number, number, number] = [52, 152, 219] // Azul claro
  const colorGris: [number, number, number] = [100, 100, 100]
  const colorBlanco: [number, number, number] = [255, 255, 255]
  const colorAlterno: [number, number, number] = [245, 245, 245]

  // 1. Encabezado
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text(titulo, 105, yPosition, { align: 'center' })

  yPosition += 10

  // Subtítulo con nombre del comité
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2])
  doc.text(`Comité: ${nombreComite}`, 105, yPosition, { align: 'center' })

  yPosition += 8

  // Fecha de generación
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(colorGris[0], colorGris[1], colorGris[2])
  const fechaFormato = fecha.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  doc.text(`Fecha de generación: ${fechaFormato}`, 105, yPosition, {
    align: 'center',
  })

  yPosition += 12

  // 2. Estadísticas Generales
  const estadisticas = calcularEstadisticas(ofrendas)

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...colorPrimario)
  doc.text('ESTADÍSTICAS GENERALES', 15, yPosition)

  yPosition += 8

  // Crear tabla de estadísticas
  const tableDataStats = [
    ['Total de Ofrendas', `${estadisticas.total}`],
    ['Monto Total', `$${estadisticas.montoTotal.toLocaleString('es-CO')}`],
    ['Promedio por Ofrenda', `$${estadisticas.promedio.toLocaleString('es-CO')}`],
    ['Máximo', `$${estadisticas.maximo.toLocaleString('es-CO')}`],
    ['Mínimo', `$${estadisticas.minimo.toLocaleString('es-CO')}`],
  ]

  autoTable(doc, {
    startY: yPosition,
    head: [['Métrica', 'Valor']],
    body: tableDataStats,
    theme: 'grid',
    headStyles: {
      fillColor: colorPrimario,
      textColor: colorBlanco,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: colorGris,
    },
    alternateRowStyles: {
      fillColor: colorAlterno,
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 50, halign: 'right' },
    },
    margin: 15,
  })

  yPosition = (doc as any).lastAutoTable.finalY + 10

  // 3. Distribución por Tipo
  const distribucionPorTipo = calcularDistribucion(ofrendas)

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text('DISTRIBUCIÓN POR TIPO', 15, yPosition)

  yPosition += 8

  const tableDataTipo = Object.entries(distribucionPorTipo).map(([tipo, data]) => [
    tipo.charAt(0).toUpperCase() + tipo.slice(1),
    `${data.cantidad}`,
    `$${data.monto.toLocaleString('es-CO')}`,
    `${data.porcentaje.toFixed(1)}%`,
  ])

  autoTable(doc, {
    startY: yPosition,
    head: [['Tipo', 'Cantidad', 'Monto', 'Porcentaje']],
    body: tableDataTipo,
    theme: 'grid',
    headStyles: {
      fillColor: colorSecundario,
      textColor: colorBlanco,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 10,
      textColor: colorGris,
    },
    alternateRowStyles: {
      fillColor: colorAlterno,
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 50, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
    margin: 15,
  })

  yPosition = (doc as any).lastAutoTable.finalY + 10

  // 4. Detalle de Ofrendas
  // Agregar nueva página si es necesario
  if (yPosition > 250) {
    doc.addPage()
    yPosition = 20
  }

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
  doc.text('DETALLE DE OFRENDAS', 15, yPosition)

  yPosition += 8

  const tableDataDetalle = ofrendas.map(ofrenda => [
    new Date(ofrenda.fecha).toLocaleDateString('es-CO'),
    ofrenda.tipo.charAt(0).toUpperCase() + ofrenda.tipo.slice(1),
    `$${ofrenda.monto.toLocaleString('es-CO')}`,
    ofrenda.concepto || '-',
    ofrenda.proyecto_nombre || '-',
  ])

  autoTable(doc, {
    startY: yPosition,
    head: [['Fecha', 'Tipo', 'Monto', 'Concepto', 'Proyecto']],
    body: tableDataDetalle,
    theme: 'grid',
    headStyles: {
      fillColor: colorPrimario,
      textColor: colorBlanco,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: colorGris,
    },
    alternateRowStyles: {
      fillColor: colorAlterno,
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 28 },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 40 },
      4: { cellWidth: 35 },
    },
    margin: 15,
    didDrawPage: function (data) {
      // Pie de página
      const pageSize = doc.internal.pageSize
      const pageHeight = pageSize.getHeight()
      const pageWidth = pageSize.getWidth()

      doc.setFontSize(9)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Página ${data.pageNumber} de ${(doc as any).internal.pages.length - 1}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )
    },
  })

  return doc
}

/**
 * Calcula estadísticas de las ofrendas
 */
function calcularEstadisticas(ofrendas: Ofrenda[]) {
  const total = ofrendas.length
  const montos = ofrendas.map(o => o.monto)
  const montoTotal = montos.reduce((sum, m) => sum + m, 0)
  const promedio = total > 0 ? montoTotal / total : 0
  const maximo = montos.length > 0 ? Math.max(...montos) : 0
  const minimo = montos.length > 0 ? Math.min(...montos) : 0

  return { total, montoTotal, promedio, maximo, minimo }
}

/**
 * Calcula la distribución por tipo de ofrenda
 */
function calcularDistribucion(ofrendas: Ofrenda[]) {
  const distribucion: Record<
    string,
    { cantidad: number; monto: number; porcentaje: number }
  > = {}

  const montoTotal = ofrendas.reduce((sum, o) => sum + o.monto, 0)

  ofrendas.forEach(ofrenda => {
    if (!distribucion[ofrenda.tipo]) {
      distribucion[ofrenda.tipo] = { cantidad: 0, monto: 0, porcentaje: 0 }
    }

    distribucion[ofrenda.tipo].cantidad++
    distribucion[ofrenda.tipo].monto += ofrenda.monto
  })

  // Calcular porcentajes
  Object.keys(distribucion).forEach(tipo => {
    distribucion[tipo].porcentaje =
      (distribucion[tipo].monto / montoTotal) * 100
  })

  return distribucion
}

/**
 * Descarga el PDF generado
 */
export function descargarPDF(
  doc: jsPDF,
  nombreArchivo: string = 'reporte-ofrendas.pdf'
) {
  doc.save(nombreArchivo)
}
