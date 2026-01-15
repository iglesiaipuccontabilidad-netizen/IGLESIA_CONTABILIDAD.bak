import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PropositoForm from '@/components/propositos/PropositoForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function EditarPropositoPage({ params }: PageProps) {
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
    .from('usuarios')
    .select('rol')
    .eq('id', user.id)
    .single()

  const isAdmin = userData?.rol === 'admin' || userData?.rol === 'tesorero'

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-lg border border-rose-200">
          No tienes permisos para editar propósitos.
        </div>
      </div>
    )
  }

  // Obtener propósito
  const { data: proposito, error } = await supabase
    .from('propositos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !proposito) {
    console.error('Error al cargar propósito:', error)
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Editar Propósito</h1>
        <PropositoForm proposito={proposito} mode="edit" />
      </div>
    </div>
  )
}