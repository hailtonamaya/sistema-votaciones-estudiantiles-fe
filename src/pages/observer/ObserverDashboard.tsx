import { DashboardLayout } from "@/components/DashboardLayout"
import { useAuth } from "@/context/AuthContext"

interface InfoCardProps {
  title: string
  description: string
  icon: React.ReactNode
  badge?: string
  badgeColor?: string
}

function InfoCard({ title, description, icon, badge, badgeColor }: InfoCardProps) {
  return (
    <div className="group cursor-pointer rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-0.5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>
        {badge && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-900 group-hover:text-[#1B2770] transition">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  )
}

export default function ObserverDashboard() {
  const { user } = useAuth()

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches"

  return (
    <DashboardLayout>
      {/* Bienvenida */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white/60">
              {greeting}, bienvenido
            </p>
            <h1 className="mt-1 text-2xl font-bold">{user?.name}</h1>
            <p className="mt-2 text-sm text-white/70">
              Tienes acceso de solo lectura para monitorear el proceso electoral.
            </p>
          </div>
          <div className="hidden md:flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </div>

        {/* Acceso restringido */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-400" />
            <span className="text-xs text-white/70">
              Sesión activa · {user?.email}
            </span>
          </div>
          <span className="text-white/30">·</span>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-xs text-white/70">Solo lectura</span>
          </div>
        </div>
      </div>

      {/* Aviso de permisos */}
      <div className="mb-8 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <svg
          className="mt-0.5 shrink-0 text-emerald-600"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Modo observación activo
          </p>
          <p className="mt-0.5 text-xs text-emerald-700">
            Puedes ver la participación y los resultados en tiempo real, pero no realizar modificaciones al sistema.
          </p>
        </div>
      </div>

      {/* Módulos disponibles */}
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400">
        Módulos disponibles
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard
          title="Participación electoral"
          description="Consulta en tiempo real cuántos estudiantes han ejercido su voto por carrera y elección."
          badge="En tiempo real"
          badgeColor="bg-emerald-100 text-emerald-700"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <InfoCard
          title="Resultados"
          description="Visualiza los votos acumulados por asociación. Los datos se actualizan conforme avanza la votación."
          badge="Solo lectura"
          badgeColor="bg-gray-100 text-gray-600"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
          }
        />
        <InfoCard
          title="Elecciones activas"
          description="Información sobre los procesos electorales en curso: nombre, carrera, horario y estado actual."
          badge="Consulta"
          badgeColor="bg-blue-100 text-blue-700"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <InfoCard
          title="Padrón electoral"
          description="Revisa el listado de estudiantes habilitados para votar y su estado de participación."
          badge="Consulta"
          badgeColor="bg-blue-100 text-blue-700"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
      </div>

      {/* Footer info */}
      <div className="mt-10 rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-center text-xs text-gray-400">
          Sistema de Votaciones Estudiantiles · UNITEC ·{" "}
          <span className="font-medium text-emerald-700">Sesión como Observador</span>
        </p>
      </div>
    </DashboardLayout>
  )
}
