'use client'

import { useEffect, useState, useTransition } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { useOrganization } from '@/lib/context/OrganizationContext'
import { useRouter } from '@/lib/hooks/useOrgRouter'
import {
  IconSettings, IconUsers, IconMail, IconPalette,
  IconBuilding, IconRefresh, IconSend, IconTrash,
  IconCopy, IconCheck, IconAlertTriangle, IconEdit,
} from '@tabler/icons-react'
import {
  obtenerConfigOrg,
  actualizarOrg,
  actualizarPersonalizacion,
  listarInvitaciones,
  listarMiembros,
  enviarInvitacion,
  cancelarInvitacion,
  cambiarRolMiembro,
  eliminarMiembro,
} from './actions'

type TabId = 'general' | 'miembros' | 'personalizacion'

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'tesorero', label: 'Tesorero' },
  { value: 'secretario', label: 'Secretario' },
  { value: 'digitador', label: 'Digitador' },
  { value: 'viewer', label: 'Visor' },
]

export default function SettingsPage() {
  const { user, member } = useAuth()
  const { organization } = useOrganization()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [orgConfig, setOrgConfig] = useState<any>(null)
  const [invitaciones, setInvitaciones] = useState<any[]>([])
  const [miembros, setMiembros] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Verificar permisos
  useEffect(() => {
    if (!member) return
    const isAdmin = member.rol === 'admin' && member.estado === 'activo'
    setIsAuthorized(isAdmin)
    if (!isAdmin) router.push('/dashboard')
  }, [member, router])

  // Cargar datos
  useEffect(() => {
    if (!organization?.id || !isAuthorized) return
    loadData()
  }, [organization?.id, isAuthorized])

  async function loadData() {
    const orgId = organization?.id
    if (!orgId) return

    const [configRes, invRes, membRes] = await Promise.all([
      obtenerConfigOrg(orgId),
      listarInvitaciones(orgId),
      listarMiembros(orgId),
    ])

    if (configRes.success) setOrgConfig(configRes.data)
    if (invRes.success) setInvitaciones(invRes.data || [])
    if (membRes.success) setMiembros(membRes.data || [])
  }

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  // ---- Handlers ----
  function handleActualizarOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.append('org_id', organization?.id || '')

    startTransition(async () => {
      const res = await actualizarOrg(fd)
      if (res.success) {
        showMsg('success', 'Datos actualizados correctamente')
        loadData()
      } else showMsg('error', res.error || 'Error')
    })
  }

  function handleActualizarPersonalizacion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.append('org_id', organization?.id || '')

    startTransition(async () => {
      const res = await actualizarPersonalizacion(fd)
      if (res.success) {
        showMsg('success', 'Personalización actualizada')
        loadData()
      } else showMsg('error', res.error || 'Error')
    })
  }

  function handleInvitar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.append('org_id', organization?.id || '')
    fd.append('invitado_por', user?.id || '')

    startTransition(async () => {
      const res = await enviarInvitacion(fd)
      if (res.success) {
        showMsg('success', 'Invitación creada')
        setInviteLink(res.link || null)
        loadData()
        ;(e.target as HTMLFormElement).reset()
      } else showMsg('error', res.error || 'Error')
    })
  }

  async function handleCancelarInvitacion(id: string) {
    const res = await cancelarInvitacion(id)
    if (res.success) {
      showMsg('success', 'Invitación cancelada')
      loadData()
    } else showMsg('error', res.error || 'Error')
  }

  async function handleCambiarRol(membershipId: string, nuevoRol: string) {
    const res = await cambiarRolMiembro(membershipId, nuevoRol)
    if (res.success) {
      showMsg('success', 'Rol actualizado')
      loadData()
    } else showMsg('error', res.error || 'Error')
  }

  async function handleEliminarMiembro(membershipId: string) {
    if (!confirm('¿Estás seguro de eliminar este miembro de la organización?')) return
    const res = await eliminarMiembro(membershipId)
    if (res.success) {
      showMsg('success', 'Miembro eliminado')
      loadData()
    } else showMsg('error', res.error || 'Error')
  }

  function copyLink() {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Auth guard
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthorized) return null

  const contacto = orgConfig?.contacto || {}
  const personalizacion = orgConfig?.personalizacion || {}

  const tabs = [
    { id: 'general' as TabId, label: 'General', icon: IconBuilding },
    { id: 'miembros' as TabId, label: 'Miembros', icon: IconUsers },
    { id: 'personalizacion' as TabId, label: 'Apariencia', icon: IconPalette },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <IconSettings size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configuración</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Administra tu organización</p>
          </div>
        </div>
        <button
          onClick={() => loadData()}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <IconRefresh size={16} />
          Recargar
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`rounded-lg border p-3 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-700 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: General */}
      {activeTab === 'general' && orgConfig && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Datos de la Iglesia</h2>
          <form onSubmit={handleActualizarOrg} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
              <input
                name="nombre"
                defaultValue={orgConfig.nombre}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pastor</label>
              <input
                name="pastor"
                defaultValue={contacto.pastor || ''}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ciudad</label>
                <input
                  name="ciudad"
                  defaultValue={contacto.ciudad || ''}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Departamento</label>
                <input
                  name="departamento"
                  defaultValue={contacto.departamento || ''}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email de contacto</label>
              <input
                name="email_contacto"
                type="email"
                defaultValue={contacto.email || ''}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>

            {/* Plan info (readonly) */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 dark:bg-slate-700/50 dark:border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Plan actual:</span>
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 capitalize dark:bg-blue-900/30 dark:text-blue-400">
                    {orgConfig.plan || 'gratuito'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {orgConfig.max_usuarios || 2} usuarios · {orgConfig.max_miembros || 50} miembros
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      )}

      {/* Tab: Miembros */}
      {activeTab === 'miembros' && (
        <div className="space-y-6">
          {/* Invitar */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <IconMail size={20} />
              Invitar usuario
            </h2>
            <form onSubmit={handleInvitar} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div className="w-48">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rol</label>
                <select
                  name="rol"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                <IconSend size={16} />
                Invitar
              </button>
            </form>

            {/* Link generado */}
            {inviteLink && (
              <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 dark:bg-blue-900/20 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
                  ¡Invitación creada! Comparte este enlace:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-white px-3 py-2 text-xs text-blue-800 border border-blue-200 break-all dark:bg-slate-800 dark:text-blue-300 dark:border-blue-700">
                    {inviteLink}
                  </code>
                  <button
                    onClick={copyLink}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 transition dark:border-blue-700 dark:bg-slate-800 dark:text-blue-400"
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Invitaciones pendientes */}
          {invitaciones.filter(i => i.estado === 'pendiente').length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">Invitaciones pendientes</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {invitaciones
                  .filter(i => i.estado === 'pendiente')
                  .map(inv => (
                    <div key={inv.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.email}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {ROLES.find(r => r.value === inv.rol)?.label || inv.rol} · Expira {new Date(inv.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCancelarInvitacion(inv.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Cancelar
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Miembros actuales */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
              Miembros actuales ({miembros.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {miembros.map((m: any) => {
                const mUser = m.usuarios as any
                const isCurrentUser = m.usuario_id === user?.id

                return (
                  <div key={m.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {mUser?.email || 'Sin email'}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Tú)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {ROLES.find(r => r.value === m.rol)?.label || m.rol} · {m.estado}
                      </p>
                    </div>
                    {!isCurrentUser && (
                      <div className="flex items-center gap-2">
                        <select
                          value={m.rol}
                          onChange={e => handleCambiarRol(m.id, e.target.value)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                        >
                          {ROLES.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleEliminarMiembro(m.id)}
                          className="rounded p-1.5 text-red-500 hover:bg-red-50 transition dark:hover:bg-red-900/20"
                          title="Eliminar miembro"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Personalización */}
      {activeTab === 'personalizacion' && orgConfig && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Apariencia</h2>
          <form onSubmit={handleActualizarPersonalizacion} className="space-y-4 max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color primario</label>
                <div className="flex items-center gap-2">
                  <input
                    name="color_primario"
                    type="color"
                    defaultValue={personalizacion.color_primario || '#3b82f6'}
                    className="h-10 w-14 rounded border border-slate-200 cursor-pointer"
                  />
                  <input
                    readOnly
                    value={personalizacion.color_primario || '#3b82f6'}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color secundario</label>
                <div className="flex items-center gap-2">
                  <input
                    name="color_secundario"
                    type="color"
                    defaultValue={personalizacion.color_secundario || '#1e40af'}
                    className="h-10 w-14 rounded border border-slate-200 cursor-pointer"
                  />
                  <input
                    readOnly
                    value={personalizacion.color_secundario || '#1e40af'}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
              <div className="flex items-center gap-2">
                <IconAlertTriangle size={16} />
                <span>Los colores personalizados se aplicarán en una próxima actualización.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Guardar apariencia'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
