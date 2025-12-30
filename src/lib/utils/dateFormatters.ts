/**
 * Formatea una fecha ISO string a formato DD/MM/YYYY
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Fecha inválida'

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return 'Fecha inválida'
  }
}

/**
 * Formatea una fecha ISO string a formato DD/MM/YYYY HH:mm
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'

  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Fecha inválida'

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return 'Fecha inválida'
  }
}