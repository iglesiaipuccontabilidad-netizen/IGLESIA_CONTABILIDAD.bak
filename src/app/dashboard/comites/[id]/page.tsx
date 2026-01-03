import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  UserCog,
  Calendar,
  Activity,
  Plus,
  DollarSign,
} from 'lucide-react'
import { UsuariosComiteSection } from '@/components/comites/UsuariosComiteSection'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: {
    id: string
  }
}

export default async function ComiteDetallePage({ params }: PageProps) {
  const supabase = await createClient()
  
  // Await params en Next.js 15+
  const { id } = await params

  // Redirigir a /dashboard/comites/[id]/dashboard
  redirect(`/dashboard/comites/${id}/dashboard`)
}
