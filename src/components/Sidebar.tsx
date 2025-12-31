"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ScrollText, Users2, UserCog, ChevronLeft, Target, FileText, Users } from "lucide-react"
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
    
    const sections: MenuSection[] = [
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
      }
    ]

    // Solo mostrar la sección de Administración si el usuario es admin o tesorero global
    if (member?.rol === 'admin' || member?.rol === 'tesorero') {
      sections.push({
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
      })
    } else if (comitesUsuario && comitesUsuario.length > 0) {
      // Si el usuario no es admin pero tiene comités asignados, mostrar sus comités
      sections.push({
        title: "Mis Comités",
        items: comitesUsuario.map(comite => ({
          href: `/dashboard/comites/${comite.comite_id}`,
          label: comite.comite_nombre,
          icon: Users,
          description: `Rol: ${comite.rol_en_comite}`
        }))
      })
    }

    return sections
  }, [member?.rol, member?.email, comitesUsuario])

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
        {menuSections.map((section) => (
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
        ))}
      </nav>

      <div className={styles.profileCard}>
        <div className={styles.avatar} aria-hidden="true">
          {initials}
        </div>
        {!isCollapsed && (
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{member?.email?.split('@')[0] ?? "Usuario"}</p>
            <span className={styles.profileRole}>
              {(() => {
                const displayValue = isLoading 
                  ? "Cargando..." 
                  : member?.rol 
                    ? member.rol.charAt(0).toUpperCase() + member.rol.slice(1) 
                    : "Sin rol"
                
                console.log('🎯 RENDERIZANDO ROL:', {
                  isLoading,
                  memberExists: !!member,
                  memberIsNull: member === null,
                  memberIsUndefined: member === undefined,
                  rol: member?.rol,
                  rolType: typeof member?.rol,
                  rolTruthy: !!member?.rol,
                  displayValue
                })
                
                return displayValue
              })()}
            </span>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
