import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { StatCard } from "@/components/StatCard"
import { TabBar } from "@/components/TabBar"
import { EmptyState } from "@/components/EmptyState"
import { useAuth } from "@/context/AuthContext"
import { useClickOutside } from "@/lib/useClickOutside"
import {
  type ApiElection,
  type ApiCareer,
  listElections,
  listCareers,
} from "@/services/admin.service"
import {
  getDashboard,
  getPrediction,
  getInsights,
  type DashboardData,
  type Prediction,
  type Insights,
} from "@/services/results.service"
import {
  CareerAssociationChart,
  CareerVotesChart,
  EscrutinioTable,
  HourlyTurnoutChart,
  PlanillasRanking,
} from "@/components/DashboardCharts"
import {
  ELECTION_STATUS_LABELS,
  formatPercent,
  renderMarkdown,
} from "@/lib/elections"
import { BRAND, ACCENT } from "@/lib/brand"
import {
  AlertTriangle,
  BarChart2,
  ChevronDown,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  Loader2,
  FileText,
  Play,
  Plus,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react"

interface ChartCardProps {
  title: string
  subtitle: string
  icon: ReactNode
  chart: ReactNode
}

function ChartLoading() {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50">
      <Loader2 size={20} className="animate-spin text-gray-300" />
    </div>
  )
}

function ChartUnavailable() {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50">
      <p className="text-sm text-gray-400">No se pudieron cargar los datos del gráfico</p>
    </div>
  )
}

function ChartCard({ title, subtitle, icon, chart }: ChartCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: BRAND }}>{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-light"
          style={{ color: BRAND }}
        >
          {icon}
        </div>
      </div>
      {chart}
    </div>
  )
}

export default function AdminDashboard() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [elections, setElections] = useState<ApiElection[]>([])
  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedCareer, setSelectedCareer] = useState("")
  const [carreraOpen, setCarreraOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [dashLoading, setDashLoading] = useState(false)
  const [predLoading, setPredLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const carreraRef = useClickOutside<HTMLDivElement>(useCallback(() => setCarreraOpen(false), []))
  const actionsRef = useClickOutside<HTMLDivElement>(useCallback(() => setActionsOpen(false), []))

  useEffect(() => {
    if (!token) return
    Promise.all([listElections(token), listCareers(token)])
      .then(([elecs, carrs]) => {
        setElections(elecs)
        setCareers(carrs)
        setFetchError(null)
      })
      .catch((e) =>
        setFetchError(e instanceof Error ? e.message : "Error al cargar los datos del dashboard"),
      )
      .finally(() => setLoading(false))
  }, [token])

  const activeElections = elections.filter((e) => e.status === "open")
  const scheduledElections = elections.filter((e) => e.status === "scheduled")
  const hasActiveElection = activeElections.length > 0
  const currentElection = activeElections[0] ?? scheduledElections[0] ?? null
  const currentElectionId = currentElection?.election_id ?? null

  useEffect(() => {
    if (!currentElectionId || !token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPredLoading(true)
    getPrediction(currentElectionId, token)
      .then(setPrediction)
      .catch(() => setPrediction(null))
      .finally(() => setPredLoading(false))

    setDashLoading(true)
    getDashboard(currentElectionId, token)
      .then(setDashboard)
      .catch(() => setDashboard(null))
      .finally(() => setDashLoading(false))

    setAiLoading(true)
    getInsights(currentElectionId, token)
      .then((ins) => { setInsights(ins); setAiError(null) })
      .catch((e) => setAiError(e?.message ?? "No se pudo generar el resumen IA"))
      .finally(() => setAiLoading(false))
  }, [currentElectionId, token])

  const renderedSummary = useMemo(
    () => (insights ? renderMarkdown(insights.summary) : null),
    [insights],
  )

  const tabs = [
    { id: "dashboard", label: "Dashboard General", icon: <LayoutDashboard size={15} /> },
    { id: "ranking", label: "Ranking de Planillas", icon: <ListOrdered size={15} /> },
    { id: "escrutinio", label: "Tabla de Escrutinio", icon: <FileText size={15} /> },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      {fetchError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {fetchError}
        </div>
      )}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>
          {currentElection ? `Dashboard — ${currentElection.title}` : "Dashboard General"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {currentElection
            ? `Estado: ${ELECTION_STATUS_LABELS[currentElection.status] ?? currentElection.status}`
            : "Aquí podrás ver el progreso de las elecciones."}
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Elecciones" value={elections.length} color={BRAND} />
        <StatCard label="Activas" value={activeElections.length} color="#16A34A" />
        <StatCard label="Programadas" value={scheduledElections.length} color="#1D4ED8" />
        <StatCard label="Carreras" value={careers.length} color={ACCENT} />
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {hasActiveElection && (
          <div className="flex items-center gap-2 rounded-full border border-green-400 px-4 py-1.5">
            <Play size={12} className="fill-green-500 text-green-500" />
            <span className="text-sm font-semibold text-green-600">
              {activeElections.length === 1
                ? "1 Elección Activa"
                : `${activeElections.length} Elecciones Activas`}
            </span>
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {/* Career selector */}
          <div ref={carreraRef} className="relative">
            <button
              onClick={() => { setCarreraOpen((p) => !p); setActionsOpen(false) }}
              aria-haspopup="listbox"
              aria-expanded={carreraOpen}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:border-gray-300"
            >
              <span className="max-w-[160px] truncate sm:max-w-[220px]">
                {careers.find((c) => c.career_id === selectedCareer)?.name ??
                  "Selecciona una carrera"}
              </span>
              <ChevronDown size={15} />
            </button>
            {carreraOpen && (
              <div
                role="listbox"
                aria-label="Selecciona una carrera"
                className="absolute right-0 top-full z-10 mt-1 max-h-60 w-64 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg"
              >
                {careers.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">Sin carreras registradas</p>
                ) : (
                  careers.map((c) => (
                    <button
                      key={c.career_id}
                      role="option"
                      aria-selected={selectedCareer === c.career_id}
                      onClick={() => { setSelectedCareer(c.career_id); setCarreraOpen(false) }}
                      className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                    >
                      {c.name} <span className="text-xs text-gray-400">({c.code})</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <button
            disabled={!hasActiveElection || !selectedCareer}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: hasActiveElection && selectedCareer ? BRAND : "#9ca3af" }}
          >
            Simular
          </button>

          {/* Actions dropdown */}
          <div ref={actionsRef} className="relative">
            <button
              onClick={() => { setActionsOpen((p) => !p); setCarreraOpen(false) }}
              aria-haspopup="menu"
              aria-expanded={actionsOpen}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300"
            >
              Acciones <ChevronDown size={15} />
            </button>
            {actionsOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-gray-100 bg-white shadow-lg"
              >
                <button
                  role="menuitem"
                  className="block w-full rounded-t-xl px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Exportar datos
                </button>
                <button
                  role="menuitem"
                  className="block w-full rounded-b-xl px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Ver historial
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === "dashboard" &&
        (!hasActiveElection ? (
          <EmptyState
            icon={<Landmark size={32} style={{ color: BRAND }} />}
            title={elections.length === 0 ? "Aún no hay elecciones" : "No hay elecciones activas"}
            description={
              elections.length === 0
                ? "Crea una nueva elección para empezar"
                : `Tienes ${elections.length} elección(es) en total. Activa una para ver el dashboard.`
            }
            action={{
              label: "Nueva Elección",
              onClick: () => navigate("/admin/elecciones/wizard?step=1"),
              icon: <Plus size={16} />,
            }}
            secondaryAction={
              elections.length > 0
                ? {
                    label: "Ver todas las elecciones",
                    onClick: () => navigate("/admin/elecciones/detalles"),
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Proyección estadística */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: BRAND }}>
                      Proyección de Resultados
                    </p>
                    <p className="text-xs text-gray-400">Pronóstico estadístico en tiempo real</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-light" style={{ color: BRAND }}>
                    <Trophy size={18} />
                  </div>
                </div>
                {predLoading ? (
                  <div className="flex h-32 items-center justify-center">
                    <Loader2 size={22} className="animate-spin text-gray-300" />
                  </div>
                ) : !prediction || !prediction.has_enough_data ? (
                  <p className="py-8 text-center text-sm text-gray-400">
                    Datos insuficientes para una proyección confiable todavía.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        Planilla líder
                      </span>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: "#EDF0F5", color: BRAND }}
                      >
                        {prediction.confidence_label}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-lg font-bold" style={{ color: BRAND }}>
                        {prediction.projected_winner?.name ?? "—"}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: ACCENT }}>
                        {prediction.projected_winner
                          ? formatPercent(prediction.projected_winner.win_probability)
                          : "—"}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">Margen</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {formatPercent(prediction.margin)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">2.º lugar</p>
                        <p className="truncate text-sm font-semibold text-gray-700">
                          {prediction.runner_up?.name ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">Pendientes</p>
                        <p className="text-sm font-semibold text-gray-700">
                          {prediction.remaining_voters}
                        </p>
                      </div>
                    </div>
                    {prediction.anomalies.length > 0 && (
                      <div className="mt-2 space-y-1 rounded-xl bg-amber-50 p-3">
                        {prediction.anomalies.slice(0, 3).map((a, i) => (
                          <p key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                            <span>
                              <strong>{a.label}:</strong> {a.note}
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resumen ejecutivo IA */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: BRAND }}>
                      Resumen Ejecutivo (IA)
                    </p>
                    <p className="text-xs text-gray-400">Análisis generado por el asistente</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-light" style={{ color: BRAND }}>
                    <Sparkles size={18} />
                  </div>
                </div>
                {aiLoading ? (
                  <div className="flex h-32 flex-col items-center justify-center gap-2 text-gray-400">
                    <Loader2 size={22} className="animate-spin" />
                    <span className="text-xs">Generando resumen…</span>
                  </div>
                ) : aiError ? (
                  <p className="py-8 text-center text-sm text-gray-400">{aiError}</p>
                ) : renderedSummary ? (
                  <div className="max-h-72 space-y-1 overflow-y-auto pr-1">{renderedSummary}</div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-400">Sin datos para analizar.</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartCard
                title="Participación por Hora"
                subtitle="Votos acumulados durante la jornada"
                icon={<TrendingUp size={18} />}
                chart={
                  dashLoading ? (
                    <ChartLoading />
                  ) : dashboard ? (
                    <HourlyTurnoutChart points={dashboard.turnout_by_hour} />
                  ) : (
                    <ChartUnavailable />
                  )
                }
              />
              <ChartCard
                title="Votos por Carrera"
                subtitle="Facultades con mayor participación"
                icon={<GraduationCap size={18} />}
                chart={
                  dashLoading ? (
                    <ChartLoading />
                  ) : dashboard ? (
                    <CareerVotesChart careers={dashboard.by_career} />
                  ) : (
                    <ChartUnavailable />
                  )
                }
              />
            </div>
            <ChartCard
              title="Distribución de Votos: Carrera y Planilla"
              subtitle="Preferencias de asociación por facultad"
              icon={<BarChart2 size={18} />}
              chart={
                dashLoading ? (
                  <ChartLoading />
                ) : dashboard ? (
                  <CareerAssociationChart associations={dashboard.by_association} />
                ) : (
                  <ChartUnavailable />
                )
              }
            />
          </div>
        ))}

      {activeTab === "ranking" &&
        (dashboard ? (
          <PlanillasRanking associations={dashboard.by_association} />
        ) : (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
            <p className="text-sm text-gray-400">
              {dashLoading ? "Cargando ranking…" : "Activa una elección para ver el ranking de planillas."}
            </p>
          </div>
        ))}

      {activeTab === "escrutinio" &&
        (dashboard ? (
          <EscrutinioTable
            careers={dashboard.by_career}
            associations={dashboard.by_association}
            totals={dashboard.totals}
          />
        ) : (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
            <p className="text-sm text-gray-400">
              {dashLoading ? "Cargando escrutinio…" : "Activa una elección para ver la tabla de escrutinio."}
            </p>
          </div>
        ))}
    </AdminLayout>
  )
}
