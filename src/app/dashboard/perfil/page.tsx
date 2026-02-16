import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { UserCog, Mail, Shield, AlertCircle } from 'lucide-react'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Cache de datos de usuario para evitar consultas duplicadas
const getUserData = cache(async (userId: string) => {
  const supabase = await createClient()
  
  const { data: userData, error } = await supabase
    .from('organizacion_usuarios')
    .select('usuario_id, rol, estado')
    .eq('usuario_id', userId)
    .eq('estado', 'activo')
    .maybeSingle()
  
  if (error) {
    console.error('Error al obtener datos de usuario:', error)
    return null
  }
  
  return userData
})

// Cache de comités del usuario
const getUserComites = cache(async (userId: string) => {
  const supabase = await createClient()
  
  const { data: comites, error } = await supabase
    .from('comite_usuarios')
    .select(`
      rol,
      estado,
      fecha_ingreso,
      comites:comite_id (
        nombre,
        descripcion
      )
    `)
    .eq('usuario_id', userId)
    .eq('estado', 'activo')
  
  if (error) {
    console.error('Error al obtener comités:', error)
    return []
  }
  
  return comites || []
})

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg">
          Debes iniciar sesión para ver tu perfil.
        </div>
      </div>
    )
  }

  // Usar funciones cacheadas para evitar consultas duplicadas
  const [userData, comites] = await Promise.all([
    getUserData(user.id),
    getUserComites(user.id)
  ])

  if (!userData) {
    notFound()
  }

  if (!userData) {
    notFound()
  }

  const rolLabels: Record<string, string> = {
    admin: 'Administrador',
    tesorero: 'Tesorero General',
    usuario: 'Usuario',
    pendiente: 'Pendiente de Aprobación'
  }

  const comiteRolLabels: Record<string, string> = {
    lider: 'Líder',
    tesorero: 'Tesorero',
    secretario: 'Secretario',
    vocal: 'Vocal'
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
            <UserCog className="w-6 h-6 text-white" />
          </div>
          Mi Perfil
        </h1>
        <p className="text-slate-600 mt-2">
          Información de tu cuenta y permisos
        </p>
      </div>

      {/* Información del usuario */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos básicos */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary-600" />
            Datos Básicos
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Correo Electrónico</label>
              <p className="text-slate-900 font-medium">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Rol en el Sistema</label>
              <p className="text-slate-900 font-medium">
                {rolLabels[userData.rol || 'usuario'] || userData.rol || 'Usuario'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Estado</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                userData.estado === 'activo' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                {userData.estado === 'activo' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Comités */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-600" />
            Comités Asignados
          </h2>
          {comites.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">Sin comités asignados</p>
                  <p className="text-sm text-amber-700 mt-1">
                    No tienes comités asignados actualmente. Contacta al administrador para solicitar acceso a un comité.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {comites.map((comite, index) => (
                <div key={`${comite.comites?.nombre}-${index}`} className="p-4 rounded-lg border border-slate-200 hover:border-primary-200 hover:bg-primary-50 transition-colors">
                  <p className="font-medium text-slate-900">
                    {comite.comites?.nombre || 'Sin nombre'}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {comiteRolLabels[comite.rol] || comite.rol}
                    </span>
                    <span className="text-xs text-slate-500">
                      Desde {new Date(comite.fecha_ingreso).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                  {comite.comites?.descripcion && (
                    <p className="text-sm text-slate-600 mt-2">
                      {comite.comites.descripcion}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Información adicional */}
      {comites.length === 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            ¿Cómo obtener acceso a un comité?
          </h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
            <li>Contacta al administrador del sistema para solicitar ser agregado a un comité</li>
            <li>El administrador podrá asignarte un rol en uno o más comités</li>
            <li>Una vez asignado, podrás ver el menú del comité en la barra lateral</li>
            <li>Dependiendo de tu rol, tendrás diferentes permisos dentro del comité</li>
          </ul>
        </div>
      )}
    </div>
  )
}
