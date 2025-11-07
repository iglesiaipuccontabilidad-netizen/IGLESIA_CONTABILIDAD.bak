'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

export async function getVotosActivos() {
  const supabase = createServerComponentClient<Database>({ cookies })
  
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
        apellidos,
        cedula
      )
    `)
    .eq('estado', 'activo')
    .order('fecha_limite', { ascending: true })

  if (error) {
    console.error('Error al obtener votos activos:', error)
    return []
  }

  return votosActivos.map(voto => {
    // Asegurarnos de que el voto siempre tenga un miembro asociado
    const miembro = voto.miembro || {
      id: 0,
      nombres: 'Sin',
      apellidos: 'asignar',
      cedula: ''
    }

    return {
      ...voto,
      miembro,
      porcentaje_completado: (Number(voto.recaudado) / Number(voto.monto_total)) * 100
    }
  })
}