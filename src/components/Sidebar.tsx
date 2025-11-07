"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ScrollText, Users2, UserCog, ChevronLeft, Target } from "lucide-react"
import styles from "@/styles/sidebar.module.css"
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

export default function Sidebar() {
  const pathname = usePathname()
  const { member } = useAuth()
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  const menuSections: MenuSection[] = React.useMemo(() => [
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
        }
      ]
    },
    {
      title: "Administración",
      items: [
        {
          href: "/dashboard/admin/usuarios",
          label: "Usuarios",
          icon: UserCog,
          description: "Roles y permisos del equipo"
        }
      ]
    }
  ], [])

  const initials = React.useMemo(() => {
    if (!member?.email) return "IP"
    // Usar el email como fallback si no hay nombres
    const [emailPrefix] = member.email.split('@')
    return emailPrefix.slice(0, 2).toUpperCase()
  }, [member])

  const handleToggle = () => setIsCollapsed((prev) => !prev)

  const isRouteActive = (href: string) => {
    if (!pathname) return false
    if (href === "/dashboard") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      <div className={styles.brandRow}>
        <div className={styles.brandMark}>IPUC</div>
        {!isCollapsed && (
          <div className={styles.brandCopy}>
            <span className={styles.brandTitle}>Contabilidad</span>
            <span className={styles.brandSubtitle}>Gestión integral de votos</span>
          </div>
        )}
        <button
          onClick={handleToggle}
          className={styles.collapseButton}
          aria-label={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <ChevronLeft className={styles.collapseIcon} />
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
              {member?.rol ? member.rol.charAt(0).toUpperCase() + member.rol.slice(1) : "Administrador"}
            </span>
          </div>
        )}
      </div>
    </aside>
  )
}
