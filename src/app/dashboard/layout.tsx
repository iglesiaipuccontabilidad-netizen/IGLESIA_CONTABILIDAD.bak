import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="p-4 rounded-lg bg-gray-50 flex items-center gap-3">
        <div className="animate-spin h-5 w-5 text-blue-500 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    </div>
  )
}

const DashboardLayoutClient = dynamic(
  () => import('@/components/DashboardLayoutClient'),
  {
    loading: Loading,
    ssr: true
  }
)

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Usar createClient que ya maneja las cookies correctamente
  const supabase = await createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <DashboardLayoutClient>
      <Suspense fallback={<Loading />}>
        {children}
      </Suspense>
    </DashboardLayoutClient>
  )
}
