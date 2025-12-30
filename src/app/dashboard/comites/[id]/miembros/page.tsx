import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { MiembrosComiteClient } from '@/components/comites/MiembrosComiteClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function MiembrosComitePage({ params }: PageProps) {
  const supabase = await createClient()

  // Obtener el usuario actual
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  // Obtener rol del usuario
  const { data: userData } = await supabase
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  // Verificar acceso al comité (si no es admin)
  let hasAccess = isAdmin
  if (!isAdmin) {
    const { data: comiteUsuario } = await supabase
      .from('comite_usuarios')
      .select('rol')
      .eq('comite_id', params.id)
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .single()

    hasAccess = !!comiteUsuario
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes acceso a este comité.
        </div>
      </div>
    )
  }

  // Obtener comité
  const { data: comite, error: comiteError } = await supabase
    .from('comites')
    .select('*')
    .eq('id', params.id)
    .single()

  if (comiteError || !comite) {
    console.error('Error al cargar comité:', comiteError)
    return notFound()
  }

  // Obtener miembros del comité
  const { data: miembros, error: miembrosError } = await supabase
    .from('comite_miembros')
    .select('*')
    .eq('comite_id', params.id)
    .order('apellidos', { ascending: true })
    .order('nombres', { ascending: true })

  if (miembrosError) {
    console.error('Error al cargar miembros:', miembrosError)
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          Error al cargar los miembros del comité.
        </div>
      </div>
    )
  }

  // Verificar si puede editar (admin o líder/tesorero del comité)
  let canEdit = isAdmin
  if (!isAdmin) {
    const { data: comiteUsuario } = await supabase
      .from('comite_usuarios')
      .select('rol')
      .eq('comite_id', params.id)
      .eq('usuario_id', user.id)
      .eq('estado', 'activo')
      .single()

    canEdit = comiteUsuario?.rol === 'lider' || comiteUsuario?.rol === 'tesorero'
  }

  return (
    <MiembrosComiteClient comite={comite} miembros={miembros || []} canEdit={canEdit} />
  )
}
