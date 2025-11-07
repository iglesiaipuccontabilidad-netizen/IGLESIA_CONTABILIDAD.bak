import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSession() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set(name: string, value: string, options: any) {
          // This is a server component, we don't need to set cookies
        },
        remove(name: string, options: any) {
          // This is a server component, we don't need to remove cookies
        },
      },
    }
  )
  
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

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
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set() {},
        remove() {},
      },
    }
  )
  
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
