'use client'

import { useEffect, useState } from 'react'

export default function TestEnvPage() {
  const [envVars, setEnvVars] = useState<any>(null)

  useEffect(() => {
    setEnvVars({
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
      urlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 8) || '',
    })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Environment Variables</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(envVars, null, 2)}
      </pre>
    </div>
  )
}
