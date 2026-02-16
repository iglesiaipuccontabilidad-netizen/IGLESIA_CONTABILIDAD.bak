'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { obtenerEstadisticas, listarOrganizaciones } from './actions'
import {
  Building2, Users, Clock, CheckCircle2, AlertTriangle,
  ArrowRight, Phone, Mail,
} from 'lucide-react'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [pendientes, setPendientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [statsRes, pendRes] = await Promise.all([
        obtenerEstadisticas(),
        listarOrganizaciones('pendiente'),
      ])
      setStats(statsRes)
      if (pendRes.success) setPendientes(pendRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Organizaciones',
      value: stats?.total_orgs || 0,
      icon: Building2,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      label: 'Pendientes de Aprobación',
      value: stats?.pendientes || 0,
      icon: Clock,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      highlight: (stats?.pendientes || 0) > 0,
    },
    {
      label: 'Activas',
      value: stats?.activas || 0,
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    },
    {
      label: 'Total Usuarios',
      value: stats?.total_usuarios || 0,
      icon: Users,
      color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-800 dark:border-slate-700 ${
              card.highlight ? 'border-amber-300 ring-2 ring-amber-200 dark:ring-amber-800' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-white shadow-sm dark:bg-slate-800 dark:border-amber-800">
          <div className="flex items-center justify-between p-5 border-b border-amber-100 dark:border-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Pendientes de aprobación ({pendientes.length})
              </h2>
            </div>
            <Link
              href="/super-admin/organizaciones?filtro=pendiente"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {pendientes.slice(0, 5).map((org) => {
              const contacto = org.contacto as any || {}
              return (
                <div key={org.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition dark:hover:bg-slate-700/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{org.nombre}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {contacto.ciudad && (
                        <span>{contacto.ciudad}, {contacto.departamento}</span>
                      )}
                      {contacto.pastor && (
                        <span>Pastor: {contacto.pastor}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {org.whatsapp && (
                      <a
                        href={`https://wa.me/${org.whatsapp.replace(/[^0-9+]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}
                    {contacto.email && (
                      <a
                        href={`mailto:${contacto.email}`}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Email
                      </a>
                    )}
                    <Link
                      href={`/super-admin/organizaciones?detalle=${org.id}`}
                      className="rounded-lg bg-violet-50 border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-400"
                    >
                      Gestionar
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {pendientes.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:bg-slate-800 dark:border-slate-700">
          <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-900 dark:text-white">Todo al día</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No hay organizaciones pendientes de aprobación</p>
        </div>
      )}
    </div>
  )
}
