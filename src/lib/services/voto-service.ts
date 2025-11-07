import { getVotoById } from '@/app/actions/votos-actions'
import type { VotoDetalle } from '@/types/votos'

/**
 * Obtiene los detalles de un voto específico, incluyendo la información del miembro
 * @param votoId - ID del voto a consultar
 * @returns Detalles del voto con información del miembro, o null si no se encuentra
 */
export async function getVotoDetails(votoId: string): Promise<VotoDetalle | null> {
  try {
    const { data: voto, error } = await getVotoById(votoId)

    if (error) {
      console.error('Error al obtener detalles del voto:', {
        error,
        votoId
      })
      return null
    }

    return voto
  } catch (error) {
    console.error('Error inesperado al obtener voto:', error)
    return null
  }
}