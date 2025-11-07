'use client'

import { actualizarEstadoVoto } from '@/app/actions/actualizar-estado-voto'
import { toast } from 'react-hot-toast'
import { RefreshCw } from 'lucide-react'

interface ActualizarEstadoVotoButtonProps {
  votoId: string
}

export default function ActualizarEstadoVotoButton({ votoId }: ActualizarEstadoVotoButtonProps) {
  const handleClick = async () => {
    try {
      const result = await actualizarEstadoVoto(votoId)
      if (result.success) {
        toast.success(result.message || 'Estado actualizado')
      } else {
        toast.error(result.error || 'Error al actualizar el estado')
      }
    } catch (error) {
      toast.error('Error al actualizar el estado')
    }
  }

  return (
    <button
      onClick={handleClick}
      title="Actualizar estado"
      className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
    >
      <RefreshCw className="w-4 h-4" />
    </button>
  )
}