import { useEffect, useState, type ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { BRAND } from "@/lib/brand"
import {
  Archive,
  BarChart2,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CreditCard,
  Eye,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  SlidersHorizontal,
  User,
  UserCog,
  Users,
} from "lucide-react"

// ─── Nav types (discriminated union eliminates href! assertions) ──────────────

interface NavChild {
  label: string
  icon: ReactNode
  href: string
}

interface NavLeaf {
  key: string
  label: string
  icon: ReactNode
  href: string
  children?: never
}

interface NavGroup {
  key: string
  label: string
  icon: ReactNode
  href?: never
  children: NavChild[]
}

type NavSection = NavLeaf | NavGroup

// ─── Nav definition ───────────────────────────────────────────────────────────

const NAV: NavSection[] = [
  {
    key: "inicio",
    label: "Inicio",
    icon: <Home size={18} />,
    children: [
      {
        label: "Dashboard General",
        icon: <LayoutDashboard size={15} />,
        href: "/admin/dashboard",
      },
      { label: "Archivados", icon: <Archive size={15} />, href: "/admin/archivados" },
    ],
  },
  {
    key: "elecciones",
    label: "Elecciones",
    icon: <Landmark size={18} />,
    children: [
      {
        label: "Detalles Generales",
        icon: <FileText size={15} />,
        href: "/admin/elecciones/detalles",
      },
      {
        label: "Asociaciones",
        icon: <Users size={15} />,
        href: "/admin/elecciones/asociaciones",
      },
      {
        label: "Candidatos",
        icon: <CreditCard size={15} />,
        href: "/admin/elecciones/candidatos",
      },
      { label: "Votantes", icon: <Users size={15} />, href: "/admin/elecciones/votantes" },
      { label: "Revisión", icon: <Eye size={15} />, href: "/admin/elecciones/revision" },
      {
        label: "Resultados",
        icon: <BarChart2 size={15} />,
        href: "/admin/elecciones/resultados",
      },
    ],
  },
  {
    key: "configuracion",
    label: "Configuración",
    icon: <Settings size={18} />,
    children: [
      { label: "Mi Perfil", icon: <User size={15} />, href: "/admin/configuracion/perfil" },
      {
        label: "Gestión de Usuarios",
        icon: <UserCog size={15} />,
        href: "/admin/configuracion/usuarios",
      },
      {
        label: "Banco de Carreras",
        icon: <GraduationCap size={15} />,
        href: "/admin/configuracion/carreras",
      },
      {
        label: "Banco de Campus",
        icon: <Building2 size={15} />,
        href: "/admin/configuracion/campus",
      },
      {
        label: "Parámetros Globales",
        icon: <SlidersHorizontal size={15} />,
        href: "/admin/configuracion/parametros",
      },
    ],
  },
  {
    key: "ayuda",
    label: "Ayuda",
    icon: <HelpCircle size={18} />,
    href: "/admin/ayuda",
  },
]

function getInitialExpanded(pathname: string): Record<string, boolean> {
  const state: Record<string, boolean> = {}
  for (const section of NAV) {
    if (section.children) {
      state[section.key] = section.children.some((c) => c.href === pathname)
    }
  }
  return state
}

interface AdminLayoutProps {
  children: ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    () => getInitialExpanded(location.pathname),
  )
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)

  // Sync isDesktop with viewport and close mobile drawer on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
      if (e.matches) setMobileOpen(false)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Close mobile drawer on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  function toggle(key: string) {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleLogout() {
    logout()
    navigate("/login")
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U"

  const showLabels = !isDesktop || !sidebarCollapsed
  const sidebarWidth = isDesktop && sidebarCollapsed ? "64px" : "256px"

  return (
    <div className="flex h-dvh bg-bg-light">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/45"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`flex flex-shrink-0 flex-col transition-all duration-300 ${!isDesktop ? "fixed inset-y-0 left-0 z-50" : ""}`}
        style={{
          backgroundColor: BRAND,
          width: sidebarWidth,
          transform: !isDesktop
            ? mobileOpen
              ? "translateX(0)"
              : "translateX(-100%)"
            : undefined,
        }}
      >
        {/* Logo + collapse button */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: showLabels ? "16px 14px" : "12px 5px",
            minHeight: showLabels ? "88px" : "60px",
          }}
        >
          {showLabels ? (
            <img
              src="/unitec_logo_2.png"
              alt="UNITEC"
              className="object-contain object-left"
              style={{ height: "56px", maxWidth: "calc(100% - 36px)" }}
            />
          ) : (
            <img
              src="/unitec_logo_blanco.png"
              alt="UNITEC"
              className="h-6 w-6 flex-shrink-0 object-contain"
            />
          )}
          <button
            onClick={() => {
              if (!isDesktop) setMobileOpen(false)
              else setSidebarCollapsed((p) => !p)
            }}
            className="flex-shrink-0 rounded p-2 text-white/70 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            style={{ marginLeft: showLabels ? "8px" : "4px" }}
            title={
              isDesktop && sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"
            }
            aria-label={
              isDesktop && sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isDesktop && sidebarCollapsed ? (
                <path d="M5 12h14M13 6l6 6-6 6" />
              ) : (
                <path d="M19 12H5M5 12l7-7M5 12l7 7" />
              )}
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          {NAV.map((section) => (
            <div key={section.key} className="mb-0.5">
              {section.children ? (
                <>
                  <button
                    onClick={() => { if (showLabels) toggle(section.key) }}
                    aria-expanded={showLabels ? (expanded[section.key] ?? false) : undefined}
                    aria-controls={`nav-section-${section.key}`}
                    className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10"
                    style={{ justifyContent: !showLabels ? "center" : "space-between" }}
                    title={!showLabels ? section.label : undefined}
                  >
                    <div className="flex items-center" style={{ gap: !showLabels ? 0 : "12px" }}>
                      {section.icon}
                      {showLabels && <span>{section.label}</span>}
                    </div>
                    {showLabels &&
                      (expanded[section.key] ? (
                        <ChevronUp size={15} />
                      ) : (
                        <ChevronDown size={15} />
                      ))}
                  </button>

                  <div id={`nav-section-${section.key}`}>
                    {showLabels && expanded[section.key] && (
                      <div className="ml-3 mt-0.5 space-y-0.5">
                        {section.children.map((child) => {
                          const active = location.pathname === child.href
                          return (
                            <Link
                              key={child.href}
                              to={child.href}
                              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition"
                              style={{
                                backgroundColor: active
                                  ? "rgba(255,255,255,0.18)"
                                  : "transparent",
                                color: active ? "#ffffff" : "rgba(255,255,255,0.7)",
                                fontWeight: active ? 600 : 400,
                              }}
                            >
                              {child.icon}
                              {child.label}
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                // NavLeaf — TypeScript knows section.href is string here
                <Link
                  to={section.href}
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition hover:bg-white/10"
                  style={{
                    backgroundColor:
                      location.pathname === section.href
                        ? "rgba(255,255,255,0.18)"
                        : "transparent",
                    color:
                      location.pathname === section.href
                        ? "#ffffff"
                        : "rgba(255,255,255,0.85)",
                    gap: !showLabels ? 0 : "12px",
                    justifyContent: !showLabels ? "center" : undefined,
                  }}
                  title={!showLabels ? section.label : undefined}
                >
                  {section.icon}
                  {showLabels && section.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User menu */}
        <div className="border-t border-white/10 px-2 pb-5 pt-3">
          {showLabels && userMenuOpen && (
            <div className="mb-1 space-y-0.5">
              <Link
                to="/admin/configuracion/perfil"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/75 transition hover:bg-white/[0.08]"
              >
                <User size={16} />
                Mi Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-400/10"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          )}

          <button
            onClick={() => { if (showLabels) setUserMenuOpen((p) => !p) }}
            aria-expanded={showLabels ? userMenuOpen : undefined}
            aria-label="Menú de usuario"
            className="flex w-full items-center rounded-xl bg-white/10 px-3 py-2.5 transition"
            style={{
              gap: !showLabels ? 0 : "12px",
              justifyContent: !showLabels ? "center" : undefined,
              cursor: !showLabels ? "default" : "pointer",
            }}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#0F49B6] text-sm font-bold text-white">
              {initials}
            </div>
            {showLabels && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs text-white/60">Administrador</p>
                </div>
                {userMenuOpen ? (
                  <ChevronDown size={14} className="shrink-0 text-white/50" />
                ) : (
                  <ChevronRight size={14} className="shrink-0 text-white/50" />
                )}
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="flex flex-shrink-0 items-center gap-3 bg-[#06065C] px-4 py-2.5 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="rounded p-1.5 text-white/80 transition hover:text-white"
          >
            <Menu size={22} />
          </button>
          <img
            src="/unitec_logo_2.png"
            alt="UNITEC"
            className="h-7 object-contain object-left"
            style={{ maxWidth: "140px" }}
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
          <footer className="mt-8 py-4 text-center text-xs text-gray-400">
            © 2026 UNITEC
          </footer>
        </main>

        {/* Portal target for wizard action bar */}
        <div id="admin-wizard-footer" className="flex-shrink-0" />
      </div>
    </div>
  )
}
