import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { EditarComiteClient } from '@/components/comites/EditarComiteClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditarComitePage({ params }: PageProps) {
  const supabase = await createClient()
  
  // Await params en Next.js 15+
  const { id } = await params

  // Verificar autenticación y permisos
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return notFound()
  }

  const { data: userData } = await supabase
    .from('organizacion_usuarios')
    .select('rol')
    .eq('usuario_id', user.id)
    .eq('estado', 'activo')
    .maybeSingle()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes permisos para editar comités.
        </div>
      </div>
    )
  }

  // Obtener comité
  const { data: comite, error } = await supabase
    .from('comites')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !comite) {
    console.error('Error al cargar comité:', error)
    return notFound()
  }

  return <EditarComiteClient comite={comite} />
}
