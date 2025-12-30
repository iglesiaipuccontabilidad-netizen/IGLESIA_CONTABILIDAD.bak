import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Proposito {
  id: string
  nombre: string
}

export function usePropositos() {
  const [propositos, setPropositos] = useState<Proposito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPropositos = async () => {
      const supabase = createClient()
      try {
        setLoading(true)
        setError(null)

        const { data, error: queryError } = await supabase
          .from('propositos')
          .select('id, nombre')
          .order('nombre')

        if (queryError) throw queryError

        setPropositos(data || [])
      } catch (err: any) {
        console.error('Error al cargar propósitos:', err)
        setError(err.message || 'Error al cargar los propósitos')
      } finally {
        setLoading(false)
      }
    }

    fetchPropositos()
  }, [])

  return { propositos, loading, error }
}