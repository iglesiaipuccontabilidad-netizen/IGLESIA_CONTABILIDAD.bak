'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestQueryPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function testQuery() {
      console.log('=== TEST QUERY PAGE ===')
      const supabase = createClient()
      
      // Primero verificar el usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      console.log('User:', user)
      console.log('User Error:', userError)
      
      if (!user) {
        setResult({ error: 'No hay usuario autenticado' })
        setLoading(false)
        return
      }
      
      // Ahora intentar la consulta
      console.log('Intentando consultar usuarios con ID:', user.id)
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      console.log('Query Data:', data)
      console.log('Query Error:', error)
      console.log('Error type:', typeof error)
      console.log('Error keys:', error ? Object.keys(error) : [])
      console.log('Error JSON:', JSON.stringify(error))
      
      setResult({ data, error, user: { id: user.id, email: user.email } })
      setLoading(false)
    }
    
    testQuery()
  }, [])

  if (loading) {
    return <div className="p-8">Cargando prueba...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Query Page</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    </div>
  )
}
