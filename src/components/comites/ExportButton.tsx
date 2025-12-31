"use client"

import { useState } from "react"
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react"

interface ExportButtonProps {
  comiteId: string
  comiteNombre: string
  tipo: "gastos" | "ofrendas" | "general"
  datos: any[]
}

export function ExportButton({ comiteId, comiteNombre, tipo, datos }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToCSV = () => {
    setIsExporting(true)

    try {
      let csvContent = ""
      let filename = ""

      if (tipo === "gastos") {
        csvContent = "Fecha,Categoría,Monto,Concepto,Beneficiario,Método Pago,Comprobante\n"
        datos.forEach((gasto) => {
          csvContent += `${gasto.fecha},${gasto.categoria},$${gasto.monto},"${gasto.concepto}",${
            gasto.beneficiario || ""
          },${gasto.metodo_pago},${gasto.numero_comprobante || ""}\n`
        })
        filename = `gastos_${comiteNombre}_${new Date().toISOString().split("T")[0]}.csv`
      } else if (tipo === "ofrendas") {
        csvContent = "Fecha,Tipo,Monto,Concepto,Nota\n"
        datos.forEach((ofrenda) => {
          csvContent += `${ofrenda.fecha},${ofrenda.tipo},$${ofrenda.monto},"${
            ofrenda.concepto || ""
          }","${ofrenda.nota || ""}"\n`
        })
        filename = `ofrendas_${comiteNombre}_${new Date().toISOString().split("T")[0]}.csv`
      } else {
        // Reporte general con balance
        csvContent = "Tipo,Descripción,Monto\n"
        filename = `reporte_${comiteNombre}_${new Date().toISOString().split("T")[0]}.csv`
      }

      // Crear blob y descargar
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      
      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Error al exportar:", error)
      alert("Error al exportar el archivo")
    } finally {
      setIsExporting(false)
    }
  }

  if (datos.length === 0) {
    return null
  }

  return (
    <button
      onClick={exportToCSV}
      disabled={isExporting}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-4 h-4" />
          Exportar CSV
        </>
      )}
    </button>
  )
}
