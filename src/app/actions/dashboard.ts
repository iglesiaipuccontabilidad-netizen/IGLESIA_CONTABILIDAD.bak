'use server'

import { createClient } from '@/lib/supabase/server'

type VotoConMiembro = {
  id: number
  proposito: string
  monto_total: number
  recaudado: number
  fecha_limite: string
  estado: string
  miembro: {
    id: number
    nombres: string
    apellidos: string
  } | null
}

export async function getVotosActivos() {
  const supabase = await createClient()
  
  const { data: votosActivos, error } = await supabase
    .from('votos')
    .select(`
      id,
      proposito,
      monto_total,
      recaudado,
      fecha_limite,
      estado,
      miembro:miembros (
        id,
        nombres,
        apellidos
      )
    `)
    .eq('estado', 'activo')
    .order('fecha_limite', { ascending: true })
    .returns<VotoConMiembro[]>()

  if (error) {
    console.error('Error al obtener votos activos:', error)
    return []
  }

  return votosActivos.map(voto => {
    // Asegurarnos de que el voto siempre tenga un miembro asociado
    const miembro = voto.miembro || {
      id: 0,
      nombres: 'Sin',
      apellidos: 'asignar'
    }

    return {
      ...voto,
      miembro,
      porcentaje_completado: (Number(voto.recaudado) / Number(voto.monto_total)) * 100
    }
  })
}