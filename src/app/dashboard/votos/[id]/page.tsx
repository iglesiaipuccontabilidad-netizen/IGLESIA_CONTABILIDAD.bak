import React from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Database } from '@/lib/database.types'
import VotoDetailClient from './page.client'


type TablaVotos = Database['public']['Tables']['votos']['Row']
type TablaMiembros = Database['public']['Tables']['miembros']['Row']
type TablaPagos = Database['public']['Tables']['pagos']['Row']

interface VotoConDetalles extends TablaVotos {
  miembro: Pick<TablaMiembros, 'id' | 'nombres' | 'apellidos'>
  pagos: Array<{
    id: string
    monto: number
    fecha_pago: string
    metodo_pago?: string
    nota?: string | null
    created_at?: string
    registrado_por?: string
    voto_id?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function VotoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!id) {
    return notFound()
  }

  const supabase = await createClient()

  const { data: votoData, error: votoError } = await supabase
    .from('votos')
    .select(`
      *,
      miembro:miembros!miembro_id (
        id,
        nombres,
        apellidos
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (votoError) {
    console.error('Error al cargar el voto:', votoError.message)
    return notFound()
  }

  if (!votoData) {
    return notFound()
  }

  // Obtener pagos por separado
  const { data: pagos, error: pagosError } = await supabase
    .from('pagos')
    .select(`
      id,
      created_at,
      fecha_pago,
      monto,
      voto_id,
      nota,
      registrado_por,
      metodo_pago
    `)
    .eq('voto_id', id)

  if (pagosError) {
    console.error('Error al cargar los pagos:', pagosError.message)
    return notFound()
  }

  const voto: VotoConDetalles = {
    ...votoData,
    pagos: pagos || []
  }

  return <VotoDetailClient voto={voto} />
}
