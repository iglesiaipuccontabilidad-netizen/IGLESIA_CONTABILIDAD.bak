'use client'

import { useAuth } from '@/lib/context/AuthContext'

export default function DebugAuthPage() {
  const { user, member, isLoading } = useAuth()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug - Estado de Autenticación</h1>
      
      <div className="space-y-6">
        {/* Estado de carga */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Estado</h2>
          <p className="mb-2">
            <span className="font-medium">IsLoading:</span>{' '}
            <span className={isLoading ? 'text-yellow-600' : 'text-green-600'}>
              {isLoading ? '⏳ Cargando...' : '✅ Cargado'}
            </span>
          </p>
        </div>

        {/* Usuario de Auth */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Usuario (auth.users)</h2>
          {user ? (
            <div className="space-y-2">
              <p><span className="font-medium">ID:</span> {user.id}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Email confirmado:</span> {user.email_confirmed_at ? '✅ Sí' : '❌ No'}</p>
              <p><span className="font-medium">Creado:</span> {user.created_at}</p>
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Ver objeto completo</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-red-600">❌ No hay usuario autenticado</p>
          )}
        </div>

        {/* Datos del Member */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Member (tabla usuarios)</h2>
          {member ? (
            <div className="space-y-2">
              <p><span className="font-medium">ID:</span> {member.id}</p>
              <p><span className="font-medium">Email:</span> {member.email || 'N/A'}</p>
              <p>
                <span className="font-medium">Rol:</span>{' '}
                <span className={`px-2 py-1 rounded text-sm ${
                  member.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                  member.rol === 'tesorero' ? 'bg-blue-100 text-blue-800' :
                  member.rol === 'usuario' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {member.rol || 'Sin rol'}
                </span>
              </p>
              <p>
                <span className="font-medium">Estado:</span>{' '}
                <span className={`px-2 py-1 rounded text-sm ${
                  member.estado === 'activo' ? 'bg-green-100 text-green-800' :
                  member.estado === 'inactivo' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.estado || 'Sin estado'}
                </span>
              </p>
              <p>
                <span className="font-medium">¿Puede ver Usuarios?:</span>{' '}
                {member.rol === 'admin' && member.estado === 'activo' ? 
                  <span className="text-green-600 font-bold">✅ SÍ</span> : 
                  <span className="text-red-600 font-bold">❌ NO</span>
                }
              </p>
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Ver objeto completo</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto text-xs">
                  {JSON.stringify(member, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <p className="text-red-600">❌ No hay datos de member cargados</p>
          )}
        </div>

        {/* Diagnóstico */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h2 className="text-xl font-semibold mb-4">Diagnóstico</h2>
          {!user && <p className="text-red-600 mb-2">⚠️ No estás autenticado. Inicia sesión primero.</p>}
          {user && !member && <p className="text-orange-600 mb-2">⚠️ Usuario autenticado pero sin datos en tabla usuarios.</p>}
          {user && member && member.rol !== 'admin' && (
            <p className="text-yellow-600 mb-2">⚠️ Tu rol ({member.rol}) no es admin. No verás la sección de Usuarios en el sidebar.</p>
          )}
          {user && member && member.estado !== 'activo' && (
            <p className="text-red-600 mb-2">⚠️ Tu cuenta está {member.estado}. Necesita estar activa para ver Usuarios.</p>
          )}
          {user && member && member.rol === 'admin' && member.estado === 'activo' && (
            <p className="text-green-600 mb-2">✅ Todo está correcto. Deberías ver la sección de Usuarios en el sidebar.</p>
          )}
        </div>
      </div>
    </div>
  )
}
