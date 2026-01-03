"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
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
  TrendingUp,
  Wallet,
  Receipt
} from "lucide-react"
import styles from "@/components/Sidebar.module.css"
import { useAuth } from "@/lib/context/AuthContext"

type MenuItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
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
  const pathname = usePathname()
  const { member, isLoading, comitesUsuario } = useAuth()
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  // Asegurar que el componente solo renderice en el cliente después de montar
  React.useEffect(() => {
    setMounted(true)
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
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuVisible])

  const menuSections: MenuSection[] = React.useMemo(() => {
    const sections: MenuSection[] = []

    // Si no está montado o está cargando, retornar array vacío
    if (!mounted || isLoading || !member) {
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
  }, [mounted, member?.rol, comitesUsuario, isLoading, member])

  const initials = React.useMemo(() => {
    if (!member?.email) return "IP"
    // Usar el email como fallback si no hay nombres
    const [emailPrefix] = member.email.split('@')
    return emailPrefix.slice(0, 2).toUpperCase()
  }, [member])

  const handleToggle = () => setIsCollapsed((prev) => !prev)

  const isRouteActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  // Información del usuario
  const userInfo = React.useMemo(() => {
    if (!member) return null
    return {
      name: member.email?.split('@')[0] || 'Usuario',
      role: member.rol || 'Miembro'
    }
  }, [member])

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <>
      {isMobileMenuVisible && (
        <div 
          className={`${styles.mobileOverlay} ${styles.visible}`}
          onClick={onMobileMenuClose}
          aria-hidden="true"
        />
      )}
      <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""} ${isMobileMenuVisible ? styles.mobileVisible : ""}`}>
        {/* Logo y título */}
        <div className={styles.brandRow}>
          <div className={styles.brandMark}>
            <Image 
              src="/icons/icon-192x192.png"
              alt="Logo IPUC"
              width={32}
              height={32}
              className={styles.logo}
            />
            {!isCollapsed && (
              <div className={styles.brandText}>
                <span className={styles.brandName}>CONTABILIDAD</span>
                <span className={styles.brandDescription}>Gestión integral de votos</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={styles.collapseButton}
            title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <ChevronLeft className={`${styles.collapseIcon} ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className={styles.navigation} aria-label="Menú principal">
          {isLoading ? (
            <div className={styles.section}>
              {!isCollapsed && (
                <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Cargando menú...
                </div>
              )}
            </div>
          ) : (
            menuSections.map((section) => (
              <div key={section.title} className={styles.section}>
                {!isCollapsed && <p className={styles.sectionTitle}>{section.title}</p>}

                <ul className={styles.navList}>
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isRouteActive(item.href)

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                          onClick={() => {
                            if (isMobileMenuVisible && onMobileMenuClose) {
                              onMobileMenuClose()
                            }
                          }}
                        >
                      <span className={styles.iconWrapper}>
                        <Icon className={styles.icon} />
                      </span>
                      {!isCollapsed && (
                        <span className={styles.linkContent}>
                          <span className={styles.linkLabel}>{item.label}</span>
                          {item.description && (
                            <span className={styles.linkDescription}>{item.description}</span>
                          )}
                        </span>
                      )}
                    </Link>

                    {!isCollapsed && item.subItems && (
                      <ul className={styles.subNavList}>
                        {item.subItems.map((subItem) => {
                          const subActive = pathname === subItem.href

                          return (
                            <li key={subItem.href}>
                              <Link
                                href={subItem.href}
                                className={`${styles.subNavLink} ${subActive ? styles.subNavLinkActive : ""}`}
                                onClick={() => {
                                  if (isMobileMenuVisible && onMobileMenuClose) {
                                    onMobileMenuClose()
                                  }
                                }}
                              >
                                <span className={styles.subBullet} aria-hidden="true" />
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
            ))
          )}
        </nav>

      <div className={styles.profileCard}>
        <div className={styles.avatar} aria-hidden="true">
          {initials}
        </div>
        {!isCollapsed && (
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{member?.email?.split('@')[0] ?? "Usuario"}</p>
            <span className={styles.profileRole}>
              {isLoading 
                ? "Cargando..." 
                : member?.rol 
                  ? rolLabels[member.rol] || member.rol.charAt(0).toUpperCase() + member.rol.slice(1)
                  : "Sin rol"}
            </span>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
