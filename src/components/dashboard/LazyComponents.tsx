'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Skeleton para componentes pesados
function DashboardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-200 rounded w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
        <div className="h-4 bg-slate-200 rounded w-4/6"></div>
      </div>
    </div>
  )
}

// Lazy loading de componentes pesados
export const VotosActivosPanelLazy = dynamic(
  () => import('@/components/dashboard/VotosActivosPanel').then(mod => ({ default: mod.default })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false
  }
)
