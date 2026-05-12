import { useNavigate } from "react-router-dom"
import { useAuth, type UserRole } from "@/context/AuthContext"

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Administrador",
  observer: "Observador",
  student: "Estudiante",
}

const ROLE_COLOR: Record<UserRole, string> = {
  admin: "bg-blue-100 text-blue-800",
  observer: "bg-emerald-100 text-emerald-800",
  student: "bg-purple-100 text-purple-800",
}

interface Props {
  children: React.ReactNode
}

export function DashboardLayout({ children }: Props) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate("/login")
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString("es-HN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-screen bg-[#EDF0F5]">
      {/* Header */}
      <header className="bg-[#1B2770] shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo + sistema */}
          <div className="flex items-center gap-4">
            <img
              src="/unitec-logo.png"
              alt="UNITEC"
              className="h-10 w-auto brightness-0 invert"
            />
            <div className="hidden sm:block">
              <p className="text-xs font-medium uppercase tracking-widest text-white/50">
                Sistema de Votaciones Estudiantiles
              </p>
            </div>
          </div>

          {/* Usuario */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-xs text-white/50">{user?.email}</p>
            </div>

            {user?.role && (
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLOR[user.role]}`}
              >
                {ROLE_LABEL[user.role]}
              </span>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Barra de fecha */}
      <div className="border-b border-[#1B2770]/10 bg-white px-6 py-2">
        <p className="mx-auto max-w-7xl text-xs capitalize text-gray-400">
          {dateStr}
        </p>
      </div>

      {/* Contenido */}
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  )
}
