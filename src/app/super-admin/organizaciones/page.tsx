'use client'

import { useEffect, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase-browser'
import {
  listarOrganizaciones,
  aprobarOrganizacion,
  rechazarOrganizacion,
  suspenderOrganizacion,
  reactivarOrganizacion,
  cambiarPlanOrg,
  obtenerDetalleOrg,
} from '../actions'
import {
  Building2, CheckCircle2, XCircle, Clock, Search,
  Phone, Mail, Users, Shield, Ban, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink, AlertTriangle,
} from 'lucide-react'

const ESTADOS = [
  { value: 'todos', label: 'Todos', color: 'bg-slate-100 text-slate-700' },
  { value: 'pendiente', label: 'Pendientes', color: 'bg-amber-100 text-amber-700' },
  { value: 'activo', label: 'Activos', color: 'bg-green-100 text-green-700' },
  { value: 'suspendido', label: 'Suspendidos', color: 'bg-red-100 text-red-700' },
  { value: 'rechazado', label: 'Rechazados', color: 'bg-slate-100 text-slate-600' },
]

const PLANES = [
  { value: 'gratuito', label: 'Gratuito', max_u: 2, max_m: 50 },
  { value: 'basico', label: 'Básico', max_u: 5, max_m: 200 },
  { value: 'profesional', label: 'Profesional', max_u: 15, max_m: 1000 },
  { value: 'enterprise', label: 'Enterprise', max_u: 50, max_m: 5000 },
]

function estadoBadge(estado: string) {
  const map: Record<string, string> = {
    pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    activo: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    suspendido: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    rechazado: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  }
  return map[estado] || 'bg-slate-100 text-slate-600'
}

function OrganizacionesContent() {
  const searchParams = useSearchParams()
  const initialFiltro = searchParams.get('filtro') || 'todos'
  const detalleId = searchParams.get('detalle')

  const [orgs, setOrgs] = useState<any[]>([])
  const [filtro, setFiltro] = useState(initialFiltro)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [mensaje, setMensaje] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(detalleId)
  const [detalles, setDetalles] = useState<Record<string, any>>({})
  const [motivoRechazo, setMotivoRechazo] = useState('')
  const [userId, setUserId] = useState<string>('')

  // Obtener user actual
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  useEffect(() => {
    loadOrgs()
  }, [filtro])

  async function loadOrgs() {
    setLoading(true)
    const res = await listarOrganizaciones(filtro)
    if (res.success) setOrgs(res.data || [])
    setLoading(false)
  }

  async function loadDetalle(orgId: string) {
    const res = await obtenerDetalleOrg(orgId)
    if (res.success) {
      setDetalles(prev => ({ ...prev, [orgId]: res }))
    }
  }

  function toggleExpand(orgId: string) {
    if (expandedId === orgId) {
      setExpandedId(null)
    } else {
      setExpandedId(orgId)
      if (!detalles[orgId]) loadDetalle(orgId)
    }
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMensaje({ type, text })
    setTimeout(() => setMensaje(null), 4000)
  }

  function handleAprobar(orgId: string) {
    startTransition(async () => {
      const res = await aprobarOrganizacion(orgId, userId)
      if (res.success) {
        showMsg('success', 'Organización aprobada exitosamente')
        loadOrgs()
      } else showMsg('error', res.error || 'Error')
    })
  }

  function handleRechazar(orgId: string) {
    if (!motivoRechazo.trim()) {
      showMsg('error', 'Ingresa un motivo de rechazo')
      return
    }
    startTransition(async () => {
      const res = await rechazarOrganizacion(orgId, motivoRechazo)
      if (res.success) {
        showMsg('success', 'Organización rechazada')
        setMotivoRechazo('')
        loadOrgs()
      } else showMsg('error', res.error || 'Error')
    })
  }

  function handleSuspender(orgId: string) {
    const motivo = prompt('Motivo de suspensión:')
    if (!motivo) return
    startTransition(async () => {
      const res = await suspenderOrganizacion(orgId, motivo)
      if (res.success) {
        showMsg('success', 'Organización suspendida')
        loadOrgs()
      } else showMsg('error', res.error || 'Error')
    })
  }

  function handleReactivar(orgId: string) {
    startTransition(async () => {
      const res = await reactivarOrganizacion(orgId, userId)
      if (res.success) {
        showMsg('success', 'Organización reactivada')
        loadOrgs()
      } else showMsg('error', res.error || 'Error')
    })
  }

  function handleCambiarPlan(orgId: string, planValue: string) {
    const plan = PLANES.find(p => p.value === planValue)
    if (!plan) return
    startTransition(async () => {
      const res = await cambiarPlanOrg(orgId, plan.value, plan.max_u, plan.max_m)
      if (res.success) {
        showMsg('success', `Plan cambiado a ${plan.label}`)
        loadOrgs()
      } else showMsg('error', res.error || 'Error')
    })
  }

  // Filtrar por búsqueda
  const filteredOrgs = orgs.filter(org => {
    if (!search) return true
    const s = search.toLowerCase()
    const contacto = org.contacto as any || {}
    return (
      org.nombre?.toLowerCase().includes(s) ||
      org.slug?.toLowerCase().includes(s) ||
      contacto.email?.toLowerCase().includes(s) ||
      contacto.ciudad?.toLowerCase().includes(s) ||
      contacto.pastor?.toLowerCase().includes(s)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Organizaciones</h1>
        <button
          onClick={() => loadOrgs()}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <RefreshCw className="w-4 h-4" />
          Recargar
        </button>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div className={`rounded-lg border p-3 text-sm ${
          mensaje.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {mensaje.text}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {ESTADOS.map(e => (
            <button
              key={e.value}
              onClick={() => setFiltro(e.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                filtro === e.value
                  ? 'bg-white shadow-sm text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ciudad, pastor..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
        </div>
      )}

      {/* Lista */}
      {!loading && filteredOrgs.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:bg-slate-800 dark:border-slate-700">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No se encontraron organizaciones</p>
        </div>
      )}

      {!loading && filteredOrgs.map(org => {
        const contacto = org.contacto as any || {}
        const isExpanded = expandedId === org.id
        const detalle = detalles[org.id]

        return (
          <div key={org.id} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            {/* Row principal */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition dark:hover:bg-slate-700/50"
              onClick={() => toggleExpand(org.id)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 flex-shrink-0 dark:bg-blue-900/30 dark:text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 truncate dark:text-white">{org.nombre}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoBadge(org.estado)}`}>
                      {org.estado}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {org.plan}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5 dark:text-slate-400">
                    {contacto.ciudad && <span>{contacto.ciudad}, {contacto.departamento}</span>}
                    {contacto.pastor && <span>Pastor: {contacto.pastor}</span>}
                    <span>Creada: {new Date(org.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {org.whatsapp && (
                  <a
                    href={`https://wa.me/${org.whatsapp.replace(/[^0-9+]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 rounded-lg bg-green-50 border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                )}
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </div>

            {/* Panel expandido */}
            {isExpanded && (
              <div className="border-t border-slate-100 p-5 bg-slate-50/50 space-y-5 dark:border-slate-700 dark:bg-slate-800/50">
                {/* Contacto */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-lg bg-white border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-1 dark:text-slate-400">Email</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{contacto.email || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-1 dark:text-slate-400">WhatsApp</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{org.whatsapp || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-white border border-slate-200 p-3 dark:bg-slate-800 dark:border-slate-700">
                    <p className="text-xs text-slate-500 mb-1 dark:text-slate-400">Slug</p>
                    <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{org.slug}</p>
                  </div>
                </div>

                {/* Límites */}
                <div className="flex items-center gap-4">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <Users className="w-3.5 h-3.5 inline mr-1" />
                    {org.max_usuarios} usuarios · {org.max_miembros} miembros
                  </div>
                  <select
                    value={org.plan}
                    onChange={e => { e.stopPropagation(); handleCambiarPlan(org.id, e.target.value) }}
                    onClick={e => e.stopPropagation()}
                    className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  >
                    {PLANES.map(p => (
                      <option key={p.value} value={p.value}>{p.label} ({p.max_u}u / {p.max_m}m)</option>
                    ))}
                  </select>
                </div>

                {/* Miembros */}
                {detalle?.miembros && detalle.miembros.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 dark:text-slate-400">
                      Miembros ({detalle.miembros.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {detalle.miembros.map((m: any) => (
                        <div key={m.id} className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs dark:bg-slate-800 dark:border-slate-700">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{(m.usuarios as any)?.email}</span>
                          <span className="ml-2 text-slate-400">({m.rol})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Motivo rechazo (si fue rechazado) */}
                {org.motivo_rechazo && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                    <strong>Motivo:</strong> {org.motivo_rechazo}
                  </div>
                )}

                {/* Acciones */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  {org.estado === 'pendiente' && (
                    <>
                      <button
                        onClick={() => handleAprobar(org.id)}
                        disabled={isPending}
                        className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Aprobar
                      </button>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={motivoRechazo}
                          onChange={e => setMotivoRechazo(e.target.value)}
                          placeholder="Motivo de rechazo..."
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm w-64 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                          onClick={e => e.stopPropagation()}
                        />
                        <button
                          onClick={() => handleRechazar(org.id)}
                          disabled={isPending}
                          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Rechazar
                        </button>
                      </div>
                    </>
                  )}

                  {org.estado === 'activo' && (
                    <button
                      onClick={() => handleSuspender(org.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition disabled:opacity-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                    >
                      <Ban className="w-4 h-4" />
                      Suspender
                    </button>
                  )}

                  {(org.estado === 'suspendido' || org.estado === 'rechazado') && (
                    <button
                      onClick={() => handleReactivar(org.id)}
                      disabled={isPending}
                      className="flex items-center gap-1.5 rounded-lg bg-green-50 border border-green-200 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition disabled:opacity-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reactivar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrganizacionesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    }>
      <OrganizacionesContent />
    </Suspense>
  )
}
