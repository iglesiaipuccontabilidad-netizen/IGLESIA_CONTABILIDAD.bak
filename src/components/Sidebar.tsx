"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import {
  LayoutDashboard,
  ScrollText,
  Users2,
  UserCog,
  ChevronLeft,
  Target,
  FileText,
  Users,
  DollarSign,
  Receipt,
  X
} from "lucide-react"
import { useAuth } from "@/lib/context/AuthContext"
import { useOrganization } from "@/lib/context/OrganizationContext"
import { useOrgNavigation } from "@/lib/hooks/useOrgNavigation"
import { OrgSwitcher } from "@/components/OrgSwitcher"

type MenuItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  description?: string
  subItems?: { href: string; label: string }[]
}

type MenuSection = {
  title: string
  items: MenuItem[]
}

interface SidebarProps {
  isMobileMenuVisible?: boolean;
  onMobileMenuClose?: () => void;
}

export default function Sidebar({ isMobileMenuVisible = false, onMobileMenuClose }: SidebarProps) {
  const { member, isLoading, comitesUsuario } = useAuth()
  const { organization } = useOrganization()
  const { orgPath, cleanPathname } = useOrgNavigation()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Debug: Log del estado del member
  React.useEffect(() => {
    console.log('🎨 [Sidebar] Estado:', {
      isLoading,
      hasMember: !!member,
      member: member ? {
        id: member.id,
        email: member.email,
        rol: member.rol,
        estado: member.estado
      } : null,
      comitesCount: comitesUsuario.length
    })
  }, [member, isLoading, comitesUsuario])

  // Detectar si es móvil con soporte para SSR
  React.useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      const mobile = window.matchMedia('(max-width: 1023px)').matches
      setIsMobile(mobile)
    }
    checkMobile()

    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)

    // Usar addEventListener con compatibilidad para navegadores antiguos
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
    } else {
      mediaQuery.addListener(handleChange)
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange)
      } else {
        mediaQuery.removeListener(handleChange)
      }
    }
  }, [])

  // Mapeo de roles para mostrar nombres legibles
  const rolLabels: Record<string, string> = {
    admin: 'Administrador',
    tesorero: 'Tesorero General',
    usuario: 'Usuario',
    pendiente: 'Pendiente'
  }

  // Efecto para manejar el scroll del body cuando el menú móvil está abierto
  React.useEffect(() => {
    if (isMobileMenuVisible) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isMobileMenuVisible])

  const menuSections: MenuSection[] = React.useMemo(() => {
    const sections: MenuSection[] = []

    // Si está cargando o no hay member, mostrar al menos el dashboard
    if (isLoading || !member) {
      sections.push({
        title: "Principal",
        items: [
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: LayoutDashboard,
            description: "Resumen general"
          }
        ]
      })
      return sections
    }

    // Solo mostrar contabilidad general si es admin o tesorero global
    const isAdminOrTesorero = member?.rol === 'admin' || member?.rol === 'tesorero'

    if (isAdminOrTesorero) {
      // Secciones de contabilidad general (solo para admin/tesorero)
      sections.push(
        {
          title: "Principal",
          items: [
            {
              href: "/dashboard",
              label: "Dashboard",
              icon: LayoutDashboard,
              description: "Resumen general y métricas clave"
            }
          ]
        },
        {
          title: "Gestión",
          items: [
            {
              href: "/dashboard/propositos",
              label: "Propósitos",
              icon: Target,
              description: "Campañas y objetivos financieros",
              subItems: [
                { href: "/dashboard/propositos/nuevo", label: "Nuevo propósito" }
              ]
            },
            {
              href: "/dashboard/votos",
              label: "Votos",
              icon: ScrollText,
              description: "Control de compromisos y pagos",
              subItems: [
                { href: "/dashboard/votos/nuevo", label: "Registrar voto" }
              ]
            },
            {
              href: "/dashboard/miembros",
              label: "Miembros",
              icon: Users2,
              description: "Gestión de la comunidad",
              subItems: [
                { href: "/dashboard/miembros/nuevo", label: "Nuevo miembro" }
              ]
            },
            {
              href: "/dashboard/reportes",
              label: "Reportes",
              icon: FileText,
              description: "Informes y exportaciones"
            }
          ]
        },
        {
          title: "Administración",
          items: [
            {
              href: "/dashboard/comites",
              label: "Comités",
              icon: Users,
              description: "Comités con contabilidad independiente",
              subItems: [
                { href: "/dashboard/comites/nuevo", label: "Nuevo comité" }
              ]
            },
            {
              href: "/dashboard/admin/usuarios",
              label: "Usuarios",
              icon: UserCog,
              description: "Roles y permisos del equipo"
            }
          ]
        }
      )
    } else if (comitesUsuario && comitesUsuario.length > 0) {
      // Usuarios de comité: mostrar sección principal de comités
      sections.push({
        title: "Administración",
        items: [
          {
            href: "/dashboard/comites",
            label: "Comités",
            icon: Users,
            description: "Comités con contabilidad independiente"
          }
        ]
      })

      // Luego mostrar cada comité con su propio menú
      comitesUsuario.forEach((comite, index) => {
        const comiteBase = `/dashboard/comites/${comite.comite_id}`

        // Obtener el label del rol en español
        const rolLabels: Record<string, string> = {
          lider: 'Líder',
          tesorero: 'Tesorero',
          secretario: 'Secretario',
          vocal: 'Vocal'
        }
        const rolLabel = rolLabels[comite.rol || 'vocal'] || comite.rol
        const comiteName = comite.comites?.nombre || 'Comité'

        sections.push({
          title: `${comiteName} · ${rolLabel}`,
          items: [
            {
              href: `${comiteBase}/dashboard`,
              label: "Dashboard",
              icon: LayoutDashboard,
              description: "Resumen y métricas del comité"
            },
            {
              href: `${comiteBase}/votos`,
              label: "Votos",
              icon: ScrollText,
              description: "Compromisos del comité",
              subItems: [
                { href: `${comiteBase}/votos/nuevo`, label: "Nuevo voto" }
              ]
            },
            {
              href: `${comiteBase}/proyectos`,
              label: "Proyectos",
              icon: Target,
              description: "Proyectos y campañas"
            },
            {
              href: `${comiteBase}/miembros`,
              label: "Miembros",
              icon: Users2,
              description: "Miembros del comité"
            },
            {
              href: `${comiteBase}/ofrendas`,
              label: "Ofrendas",
              icon: DollarSign,
              description: "Registro de ofrendas"
            },
            {
              href: `${comiteBase}/gastos`,
              label: "Gastos",
              icon: Receipt,
              description: "Gastos y egresos"
            }
          ]
        })
      })
    } else {
      // Usuario sin comités asignados: mostrar mensaje informativo
      sections.push({
        title: "Mi Perfil",
        items: [
          {
            href: "/dashboard/perfil",
            label: "Perfil",
            icon: UserCog,
            description: "Información de mi cuenta"
          }
        ]
      })
    }

    return sections
  }, [member?.rol, comitesUsuario, isLoading, member])

  const initials = React.useMemo(() => {
    if (!member?.email) return "IP"
    // Usar el email como fallback si no hay nombres
    const [emailPrefix] = member.email.split('@')
    return emailPrefix.slice(0, 2).toUpperCase()
  }, [member])

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return cleanPathname === href
    }
    return cleanPathname?.startsWith(href)
  }

  // Handle mobile menu close via click on links if on mobile
  const handleLinkClick = () => {
    if (isMobileMenuVisible && onMobileMenuClose) {
      onMobileMenuClose()
    }
  }

  // Para SSR, mostrar la versión desktop por defecto (será corregido después de montar)
  const showMobileVersion = mounted && isMobile

  return (
    <>
      {/* Mobile Overlay - Solo visible en pantallas menores a lg y cuando está montado */}
      {showMobileVersion && (
        <div
          className={`
            fixed inset-0 z-[9998] transition-all duration-300 ease-out
            ${isMobileMenuVisible
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none"
            }
          `}
          onClick={onMobileMenuClose}
          aria-hidden="true"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full z-[9999] flex flex-col 
          shadow-2xl transition-all duration-300 ease-out
          ${showMobileVersion
            ? (isMobileMenuVisible ? "translate-x-0" : "-translate-x-full")
            : "translate-x-0"
          }
        `}
        style={{
          background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 40%, #0f172a 100%)',
          width: showMobileVersion
            ? 'min(85vw, 320px)'
            : (isCollapsed ? '80px' : '288px'),
        }}
      >
        {/* Header / Logo + Mobile Close Button */}
        <div
          className="flex items-center gap-3 shrink-0 border-b border-white/10"
          style={{
            padding: showMobileVersion ? '16px' : (isCollapsed ? '16px 8px' : '20px'),
          }}
        >
          {/* Logo */}
          <div
            className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shrink-0 overflow-hidden"
            style={{
              width: showMobileVersion ? '40px' : '44px',
              height: showMobileVersion ? '40px' : '44px',
            }}
          >
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo IPUC"
              width={44}
              height={44}
              className="object-cover"
            />
          </div>

          {/* Brand Text - Hidden when collapsed on desktop */}
          {(!isCollapsed || showMobileVersion) && (
            <div className="flex flex-col min-w-0 flex-1">
              <span
                className="font-bold text-cyan-200 leading-tight truncate"
                style={{ fontSize: showMobileVersion ? '15px' : '18px' }}
                title={organization?.nombre || 'CONTABILIDAD'}
              >
                {organization?.nombre || 'CONTABILIDAD'}
              </span>
              <span
                className="text-slate-300 font-medium tracking-wide opacity-80"
                style={{ fontSize: showMobileVersion ? '10px' : '12px' }}
              >
                {organization ? (organization.plan !== 'gratuito' ? `Plan ${organization.plan}` : 'Gestión Integral') : 'Gestión Integral'}
              </span>
              <OrgSwitcher />
            </div>
          )}

          {/* Mobile Close Button */}
          {showMobileVersion && (
            <button
              onClick={onMobileMenuClose}
              className="ml-auto flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all duration-200 active:scale-95"
              style={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
              }}
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop Collapse Button */}
          {!showMobileVersion && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="ml-auto flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              style={{ width: '28px', height: '28px' }}
              title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            paddingTop: showMobileVersion ? '12px' : '16px',
            paddingBottom: showMobileVersion ? '12px' : '16px',
          }}
        >
          {menuSections.map((section) => (
            <div
              key={section.title}
              style={{
                marginBottom: showMobileVersion ? '16px' : '24px',
                paddingLeft: showMobileVersion ? '12px' : '12px',
                paddingRight: showMobileVersion ? '12px' : '12px',
              }}
            >
              {/* Section Title - Hidden when collapsed */}
              {(!isCollapsed || showMobileVersion) && (
                <h3
                  className="font-bold text-cyan-400/80 uppercase tracking-wider"
                  style={{
                    fontSize: showMobileVersion ? '10px' : '11px',
                    paddingLeft: '12px',
                    marginBottom: showMobileVersion ? '8px' : '10px',
                  }}
                >
                  {section.title}
                </h3>
              )}

              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isRouteActive(item.href)

                  return (
                    <li key={item.href}>
                      <Link
                        href={orgPath(item.href)}
                        onClick={handleLinkClick}
                        className={`
                          group relative flex items-center rounded-lg transition-all duration-200 outline-none
                          ${active
                            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-50'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }
                        `}
                        style={{
                          gap: showMobileVersion ? '12px' : '12px',
                          padding: showMobileVersion ? '12px' : (isCollapsed ? '12px 8px' : '10px 12px'),
                          minHeight: showMobileVersion ? '48px' : '44px', // Touch target mínimo
                          justifyContent: isCollapsed && !showMobileVersion ? 'center' : 'flex-start',
                        }}
                        title={isCollapsed && !showMobileVersion ? item.label : undefined}
                      >
                        {/* Active Indicator */}
                        {active && (
                          <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 bg-cyan-400 rounded-r-full"
                            style={{ width: '3px', height: '24px' }}
                          />
                        )}

                        <Icon
                          className="shrink-0 transition-colors"
                          style={{
                            width: showMobileVersion ? '22px' : '20px',
                            height: showMobileVersion ? '22px' : '20px',
                            color: active ? '#22d3ee' : undefined,
                          }}
                        />

                        {/* Label - Hidden when collapsed on desktop */}
                        {(!isCollapsed || showMobileVersion) && (
                          <div className="flex-1 flex flex-col min-w-0">
                            <span
                              className={`leading-none ${active ? 'font-semibold' : 'font-medium'}`}
                              style={{ fontSize: showMobileVersion ? '14px' : '14px' }}
                            >
                              {item.label}
                            </span>
                          </div>
                        )}
                      </Link>

                      {/* Sub Items */}
                      {item.subItems && (!isCollapsed || showMobileVersion) && (active || item.subItems.some((si: { href: string; label: string }) => isRouteActive(si.href))) && (
                        <ul
                          className="space-y-1"
                          style={{
                            paddingLeft: showMobileVersion ? '36px' : '36px',
                            marginTop: '4px',
                          }}
                        >
                          {item.subItems.map((subItem) => {
                            const subActive = cleanPathname === subItem.href
                            return (
                              <li key={subItem.href}>
                                <Link
                                  href={orgPath(subItem.href)}
                                  onClick={handleLinkClick}
                                  className={`
                                    block rounded-md transition-all duration-200 border-l-2
                                    ${subActive
                                      ? 'text-cyan-300 font-medium bg-cyan-500/10 border-cyan-500'
                                      : 'text-slate-400 hover:text-white border-transparent hover:border-white/30'
                                    }
                                  `}
                                  style={{
                                    padding: showMobileVersion ? '10px 12px' : '8px 12px',
                                    fontSize: showMobileVersion ? '13px' : '12px',
                                    minHeight: showMobileVersion ? '44px' : '36px',
                                  }}
                                >
                                  {subItem.label}
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer / User Profile */}
        <div
          className="shrink-0 border-t border-white/10"
          style={{
            padding: showMobileVersion ? '16px' : '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
          }}
        >
          <div
            className="flex items-center"
            style={{
              gap: '12px',
              justifyContent: isCollapsed && !showMobileVersion ? 'center' : 'flex-start',
            }}
          >
            {/* User Avatar */}
            <div
              className="flex items-center justify-center rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold shadow-md shrink-0"
              style={{
                width: showMobileVersion ? '40px' : '40px',
                height: showMobileVersion ? '40px' : '40px',
                fontSize: showMobileVersion ? '14px' : '14px',
              }}
            >
              {initials}
            </div>

            {/* User Info - Hidden when collapsed on desktop */}
            {(!isCollapsed || showMobileVersion) && (
              <div
                className="flex flex-col min-w-0 overflow-hidden"
                style={{ flex: 1 }}
              >
                <span
                  className="font-medium text-cyan-100 truncate block"
                  style={{ fontSize: showMobileVersion ? '14px' : '14px' }}
                >
                  {member?.email?.split('@')[0] || 'Usuario'}
                </span>
                <span
                  className="text-slate-400 truncate block"
                  style={{ fontSize: showMobileVersion ? '12px' : '12px' }}
                >
                  {isLoading
                    ? "Cargando..."
                    : member?.rol
                      ? rolLabels[member.rol] || member.rol
                      : "Sin rol"}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

