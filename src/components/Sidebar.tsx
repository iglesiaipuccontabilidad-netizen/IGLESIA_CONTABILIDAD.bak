"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ScrollText, Users2, UserCog, ChevronLeft, Target, FileText } from "lucide-react"
import styles from "@/styles/sidebar.module.css"
import { useAuth } from "@/lib/context/AuthContext"
import LogoutButton from "./LogoutButton"

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

// Componente UserSection para la información del usuario y cerrar sesión
function UserSection({ isCollapsed }: { isCollapsed: boolean }) {
  const { member, isLoading } = useAuth()
  
  return (
    <div className={styles.userSection}>
      {!isCollapsed && (
        <div className={styles.userInfo}>
          <div className="text-sm font-medium text-gray-900">{member?.email || "Usuario"}</div>
          <div className="text-xs text-gray-500">
            {isLoading ? "Cargando..." : (member?.rol ? member.rol.charAt(0).toUpperCase() + member.rol.slice(1) : "Sin rol")}
          </div>
        </div>
      )}
      <LogoutButton collapsed={isCollapsed} />
    </div>
  )
}

export default function Sidebar({ isMobileMenuVisible = false, onMobileMenuClose }: SidebarProps) {
  const pathname = usePathname()
  const { member, isLoading } = useAuth()
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
    // Debug: verificar el rol del usuario
    console.log('🔍 Sidebar - Rol del usuario:', member?.rol, 'Email:', member?.email)
    
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

    // Solo mostrar la sección de Administración si el usuario es admin
    if (member?.rol === 'admin') {
      console.log('✅ Agregando sección de Administración')
      sections.push({
        title: "Administración",
        items: [
          {
            href: "/dashboard/admin/usuarios",
            label: "Usuarios",
            icon: UserCog,
            description: "Roles y permisos del equipo"
          }
        ]
      })
    } else {
      console.log('❌ No se agrega Administración - Rol actual:', member?.rol)
    }

    return sections
  }, [member?.rol, member?.email])

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
                <span className={styles.brandName}>IPUC</span>
                <span className={styles.brandDescription}>Sistema de votos</span>
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

        {/* Información del usuario y botón de cerrar sesión */}
        <UserSection isCollapsed={isCollapsed} />

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
              {isLoading ? "Cargando..." : (member?.rol ? member.rol.charAt(0).toUpperCase() + member.rol.slice(1) : "Sin rol")}
            </span>
          </div>
        )}
      </div>
    </aside>
    </>
  )
}
