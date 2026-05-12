import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
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

// ── Brand colors (UNITEC Manual de Marca) ──────────────────
// Federal Blue  #06065C  — primary dark
// Cobalt Blue   #0F49B6  — primary medium
// Pacific Cyan  #03AED2  — secondary
// Vivid Sky Blue #47C8F0 — accent

interface NavChild {
  label: string
  icon: React.ReactNode
  href: string
}

interface NavSection {
  key: string
  label: string
  icon: React.ReactNode
  children?: NavChild[]
  href?: string
}

const NAV: NavSection[] = [
  {
    key: "inicio",
    label: "Inicio",
    icon: <Home size={18} />,
    children: [
      { label: "Dashboard General", icon: <LayoutDashboard size={15} />, href: "/admin/dashboard" },
      { label: "Archivados", icon: <Archive size={15} />, href: "/admin/archivados" },
    ],
  },
  {
    key: "elecciones",
    label: "Elecciones",
    icon: <Landmark size={18} />,
    children: [
      { label: "Detalles Generales", icon: <FileText size={15} />, href: "/admin/elecciones/detalles" },
      { label: "Asociaciones", icon: <Users size={15} />, href: "/admin/elecciones/asociaciones" },
      { label: "Candidatos", icon: <CreditCard size={15} />, href: "/admin/elecciones/candidatos" },
      { label: "Votantes", icon: <Users size={15} />, href: "/admin/elecciones/votantes" },
      { label: "Revisión", icon: <Eye size={15} />, href: "/admin/elecciones/revision" },
      { label: "Resultados", icon: <BarChart2 size={15} />, href: "/admin/elecciones/resultados" },
    ],
  },
  {
    key: "configuracion",
    label: "Configuración",
    icon: <Settings size={18} />,
    children: [
      { label: "Mi Perfil", icon: <User size={15} />, href: "/admin/configuracion/perfil" },
      { label: "Gestión de Usuarios", icon: <UserCog size={15} />, href: "/admin/configuracion/usuarios" },
      { label: "Banco de Carreras", icon: <GraduationCap size={15} />, href: "/admin/configuracion/carreras" },
      { label: "Banco de Campus", icon: <Building2 size={15} />, href: "/admin/configuracion/campus" },
      { label: "Parámetros Globales", icon: <SlidersHorizontal size={15} />, href: "/admin/configuracion/parametros" },
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

interface Props {
  children: React.ReactNode
}

export function AdminLayout({ children }: Props) {
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

  // Track breakpoint changes
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const handler = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches)
      if (e.matches) setMobileOpen(false)
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

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
    <div className="flex min-h-screen bg-[#EDF0F5]" style={{ fontFamily: "'Poppins', sans-serif" }}>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-shrink-0 flex-col transition-all duration-300 ${!isDesktop ? "fixed inset-y-0 left-0 z-50" : ""}`}
        style={{
          backgroundColor: "#06065C",
          width: sidebarWidth,
          transform: !isDesktop ? (mobileOpen ? "translateX(0)" : "translateX(-100%)") : undefined,
        }}
      >
        {/* Logo + collapse/close button — always horizontal */}
        <div
          className="flex items-center justify-between"
          style={{ padding: showLabels ? "16px 14px" : "12px 5px", minHeight: showLabels ? "88px" : "60px" }}
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
              className="object-contain flex-shrink-0"
              style={{ height: "24px", width: "24px" }}
            />
          )}
          <button
            onClick={() => { if (!isDesktop) setMobileOpen(false); else setSidebarCollapsed((p) => !p) }}
            className="flex-shrink-0 rounded p-1 transition"
            style={{ color: "rgba(255,255,255,0.55)", marginLeft: showLabels ? "8px" : "4px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.55)")}
            title={isDesktop && sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isDesktop && sidebarCollapsed
                ? <path d="M5 12h14M13 6l6 6-6 6" />
                : <path d="M19 12H5M5 12l7-7M5 12l7 7" />}
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 pb-2">
          {NAV.map((section) => (
            <div key={section.key} className="mb-0.5">
              {section.children ? (
                <>
                  <button
                    onClick={() => { if (showLabels) toggle(section.key) }}
                    className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      justifyContent: !showLabels ? "center" : "space-between",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    title={!showLabels ? section.label : undefined}
                  >
                    <div className="flex items-center" style={{ gap: !showLabels ? 0 : "12px" }}>
                      {section.icon}
                      {showLabels && <span>{section.label}</span>}
                    </div>
                    {showLabels && (
                      expanded[section.key] ? <ChevronUp size={15} /> : <ChevronDown size={15} />
                    )}
                  </button>

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
                              backgroundColor: active ? "rgba(255,255,255,0.18)" : "transparent",
                              color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
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
                </>
              ) : (
                <Link
                  to={section.href!}
                  className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition"
                  style={{
                    backgroundColor:
                      location.pathname === section.href ? "rgba(255,255,255,0.18)" : "transparent",
                    color:
                      location.pathname === section.href ? "#ffffff" : "rgba(255,255,255,0.85)",
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

        {/* Bottom: expandable user menu + user card */}
        <div className="px-2 pb-5 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          {showLabels && userMenuOpen && (
            <div className="mb-1 space-y-0.5">
              <Link
                to="/admin/configuracion/perfil"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition"
                style={{ color: "rgba(255,255,255,0.7)" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <User size={16} />
                Mi Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition"
                style={{ color: "#f87171" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.1)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          )}

          <button
            onClick={() => { if (showLabels) setUserMenuOpen((p) => !p) }}
            className="flex w-full items-center rounded-xl px-3 py-2.5 transition"
            style={{
              backgroundColor: "rgba(255,255,255,0.1)",
              gap: !showLabels ? 0 : "12px",
              justifyContent: !showLabels ? "center" : undefined,
              cursor: !showLabels ? "default" : "pointer",
            }}
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: "#0F49B6" }}
            >
              {initials}
            </div>
            {showLabels && (
              <>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                    Administrador
                  </p>
                </div>
                {userMenuOpen
                  ? <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                  : <ChevronRight size={14} style={{ color: "rgba(255,255,255,0.4)", flexShrink: 0 }} />
                }
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Mobile top bar — hidden on desktop */}
        <div
          className="flex items-center gap-3 lg:hidden"
          style={{
            backgroundColor: "#06065C",
            padding: "12px 16px",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded p-1 transition"
            style={{ color: "rgba(255,255,255,0.8)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
          >
            <Menu size={22} />
          </button>
        </div>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        <footer className="py-4 text-center text-xs text-gray-400">© 2026 UNITEC</footer>
      </div>
    </div>
  )
}
