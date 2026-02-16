import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PropositoDetailClient from '@/components/propositos/PropositoDetailClient'
import type { Database } from '@/lib/database.types'

type Proposito = Database['public']['Tables']['propositos']['Row']

// Tipo para votos con miembro incluido (lo que realmente devuelve la query)
type VotoConMiembro = Database['public']['Tables']['votos']['Row'] & {
  miembro: {
    id: string
    nombres: string
    apellidos: string
  } | null
}

export const dynamic = 'force-dynamic'

async function getPropositoConVotos(id: string) {
  const supabase = await createClient()
  
  const { data: proposito, error } = await supabase
    .from('propositos')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !proposito) {
    return null
  }
  
  const { data: votos, error: votosError } = await supabase
    .from('votos')
    .select(`
      *,
      miembro:miembros (
        id,
        nombres,
        apellidos
      )
    `)
    .eq('proposito_id', id)
    .order('created_at', { ascending: false })
  
  if (votosError) {
    console.error('Error al cargar votos:', votosError)
  }
  
  return {
    proposito,
    votos: votos || []
  }
}

export default async function PropositoDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Obtener datos del propósito
  const data = await getPropositoConVotos(id)

  if (!data) {
    notFound()
  }

  // Obtener rol del usuario
  const { data: { user } } = await supabase.auth.getUser()
  let userRole = 'usuario'

  if (user) {
    const { data: userData } = await supabase
      .from('organizacion_usuarios')
      .select('rol')
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .maybeSingle()

    userRole = userData?.rol || 'usuario'
  }

  const { proposito, votos } = data

  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PropositoDetailClient
        proposito={proposito}
        votos={votos}
        userRole={userRole}
      />
    </Suspense>
  )
}
