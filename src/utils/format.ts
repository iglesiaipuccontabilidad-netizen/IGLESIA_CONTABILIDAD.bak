export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

export const formatearPeso = formatCurrency

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatearCedula(cedula: string): string {
  return cedula.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export function getProgressStatus(percentage: number): string {
  if (percentage >= 100) return 'completado'
  if (percentage >= 75) return 'buen-progreso'
  if (percentage >= 50) return 'progreso-medio'
  if (percentage >= 25) return 'progreso-bajo'
  return 'iniciando'
}