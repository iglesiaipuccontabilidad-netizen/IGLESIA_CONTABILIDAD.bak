'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSupabasePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function testQuery() {
      try {
        console.log('🧪 Test: Iniciando consulta de prueba...')
        
        // 1. Verificar usuario actual
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('Usuario actual:', user?.email, user?.id)
        
        if (userError) {
          console.error('Error al obtener usuario:', userError)
          setResult({ error: 'No autenticado', details: userError })
          setLoading(false)
          return
        }

        if (!user) {
          setResult({ error: 'No hay usuario autenticado' })
          setLoading(false)
          return
        }

        // 2. Consultar tabla usuarios
        console.log('🧪 Test: Consultando tabla usuarios para ID:', user.id)
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        console.log('🧪 Test: Resultado de la consulta:')
        console.log('  Data:', data)
        console.log('  Error:', error)

        setResult({
          userId: user.id,
          userEmail: user.email,
          queryData: data,
          queryError: error,
          success: !error && !!data
        })
      } catch (err) {
        console.error('🧪 Test: Excepción:', err)
        setResult({ exception: String(err) })
      } finally {
        setLoading(false)
      }
    }

    testQuery()
  }, [])

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Test de Consulta a Supabase</h1>
      
      {loading ? (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">⏳ Ejecutando prueba...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {result?.success ? (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h2 className="text-xl font-semibold text-green-800 mb-4">✅ Consulta Exitosa</h2>
              <div className="space-y-2 text-sm">
                <p><strong>User ID:</strong> {result.userId}</p>
                <p><strong>Email:</strong> {result.userEmail}</p>
                <p><strong>Rol encontrado:</strong> {result.queryData?.rol || 'N/A'}</p>
                <p><strong>Estado:</strong> {result.queryData?.estado || 'N/A'}</p>
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Ver datos completos</summary>
                <pre className="mt-2 p-4 bg-white rounded overflow-auto text-xs">
                  {JSON.stringify(result.queryData, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h2 className="text-xl font-semibold text-red-800 mb-4">❌ Error en Consulta</h2>
              <div className="space-y-2 text-sm">
                {result?.error && <p><strong>Error:</strong> {result.error}</p>}
                {result?.userId && <p><strong>User ID:</strong> {result.userId}</p>}
                {result?.userEmail && <p><strong>Email:</strong> {result.userEmail}</p>}
              </div>
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Ver error completo</summary>
                <pre className="mt-2 p-4 bg-white rounded overflow-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>

              {result?.queryError && (
                <div className="mt-4 p-4 bg-white rounded">
                  <h3 className="font-semibold mb-2">Detalles del Error de Supabase:</h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.queryError, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2">Diagnóstico:</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              {!result?.userId && <li className="text-red-600">No hay usuario autenticado</li>}
              {result?.userId && !result?.queryData && <li className="text-red-600">Usuario autenticado pero no se encontraron datos en tabla usuarios</li>}
              {result?.queryError && (
                <li className="text-red-600">
                  Error de Supabase: {result.queryError.message || 'Error desconocido'}
                </li>
              )}
              {result?.success && <li className="text-green-600">✅ Todo funciona correctamente</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
