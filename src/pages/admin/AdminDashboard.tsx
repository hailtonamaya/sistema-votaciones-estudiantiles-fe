import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiElection,
  type ApiCareer,
  listElections,
  listCareers,
} from "@/services/admin.service"
import {
  getPrediction,
  getInsights,
  type Prediction,
  type Insights,
} from "@/services/results.service"
import {
  AlertTriangle,
  BarChart2,
  ChevronDown,
  FileText,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  Loader2,
  Play,
  Plus,
  Sparkles,
  TrendingUp,
  Trophy,
} from "lucide-react"

const BRAND = "#06065C"
const ACCENT = "#03AED2"

function pct(n: number): string {
  const v = n <= 1 ? n * 100 : n
  return `${v.toFixed(1)}%`
}

function renderSummary(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return (
      <p key={i} className={line.trim() === "" ? "h-2" : "text-sm leading-relaxed text-gray-600"}>
        {parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j} style={{ color: BRAND }}>{p.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{p.replace(/^[-•]\s*/, "• ")}</span>
          ),
        )}
      </p>
    )
  })
}

const STATUS_LABELS: Record<string, string> = {
  open: "Activa",
  closed: "Finalizada",
  draft: "Borrador",
  scheduled: "Programada",
  cancelled: "Archivada",
}

function LineChart() {
  const pts: [number, number][] = [
    [0, 190], [60, 185], [120, 170], [180, 140],
    [240, 100], [300, 50], [360, 10],
  ]
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ")
  return (
    <svg viewBox="0 0 380 200" className="w-full" preserveAspectRatio="none">
      {[0, 50, 100, 150, 200].map((y) => (
        <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
      ))}
      <path d={d} fill="none" stroke={BRAND} strokeWidth="2.5" strokeLinecap="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill={BRAND} />)}
    </svg>
  )
}

function BarChartSvg() {
  const bars = [
    { value: 55, color: "#47C8F0" },
    { value: 70, color: "#47C8F0" },
    { value: 120, color: ACCENT },
  ]
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {[0, 50, 100, 150, 200].map((y) => (
        <line key={y} x1="0" y1={200 - y} x2="360" y2={200 - y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
      ))}
      {bars.map((bar, i) => {
        const h = (bar.value / 200) * 190
        return <rect key={i} x={30 + i * 90} y={200 - h} width={60} height={h} fill={bar.color} rx="4" />
      })}
    </svg>
  )
}

function StackedBarChartSvg() {
  const bars = [
    { segs: [{ color: ACCENT, val: 50 }] },
    { segs: [{ color: "#47C8F0", val: 60 }] },
    { segs: [{ color: BRAND, val: 70 }, { color: "#0F49B6", val: 60 }] },
  ]
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {[0, 50, 100, 150, 200].map((y) => (
        <line key={y} x1="0" y1={200 - y} x2="360" y2={200 - y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
      ))}
      {bars.map((bar, i) => {
        let yOff = 200
        return (
          <g key={i}>
            {bar.segs.map((seg, si) => {
              const h = (seg.val / 200) * 190
              yOff -= h
              return (
                <rect key={si} x={30 + i * 90} y={yOff} width={60} height={h} fill={seg.color}
                  rx={si === bar.segs.length - 1 ? 4 : 0} />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

interface ChartCardProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  yLabels: string[]
  xLabels: string[]
  chart: React.ReactNode
}

function ChartCard({ title, subtitle, icon, yLabels, xLabels, chart }: ChartCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: BRAND }}>{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#EDF0F5", color: BRAND }}>
          {icon}
        </div>
      </div>
      <div className="flex">
        <div className="flex w-8 flex-col-reverse justify-between pr-1 text-right">
          {yLabels.map((l) => <span key={l} className="text-[10px] text-gray-400">{l}</span>)}
        </div>
        <div className="flex-1">{chart}</div>
      </div>
      <div className="mt-1 flex justify-around pl-8">
        {xLabels.map((l) => <span key={l} className="text-center text-[10px] text-gray-400">{l}</span>)}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color }}>{value}</p>
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
  const [accionesOpen, setActionsOpen] = useState(false)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [predLoading, setPredLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      listElections(token!),
      listCareers(token!),
    ])
      .then(([elecs, carrs]) => {
        setElections(elecs)
        setCareers(carrs)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const activeElections = elections.filter((e) => e.status === "open")
  const scheduledElections = elections.filter((e) => e.status === "scheduled")
  const hasActiveElection = activeElections.length > 0
  const currentElection = activeElections[0] ?? scheduledElections[0] ?? null
  const currentElectionId = currentElection?.election_id ?? null

  useEffect(() => {
    if (!currentElectionId || !token) {
      setPrediction(null)
      setInsights(null)
      return
    }
    setPredLoading(true)
    getPrediction(currentElectionId, token)
      .then(setPrediction)
      .catch(() => setPrediction(null))
      .finally(() => setPredLoading(false))

    setAiLoading(true)
    setAiError(null)
    getInsights(currentElectionId, token)
      .then(setInsights)
      .catch((e) => setAiError(e?.message ?? "No se pudo generar el resumen IA"))
      .finally(() => setAiLoading(false))
  }, [currentElectionId, token])

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
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>
          {currentElection ? `Dashboard — ${currentElection.title}` : "Dashboard General"}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {currentElection
            ? `Estado: ${STATUS_LABELS[currentElection.status] ?? currentElection.status}`
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
              {activeElections.length === 1 ? "1 Elección Activa" : `${activeElections.length} Elecciones Activas`}
            </span>
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {/* Career selector */}
          <div className="relative">
            <button
              onClick={() => { setCarreraOpen((p) => !p); setActionsOpen(false) }}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:border-gray-300"
            >
              <span className="max-w-[160px] truncate sm:max-w-[220px]">
                {careers.find((c) => c.career_id === selectedCareer)?.name ?? "Selecciona una carrera"}
              </span>
              <ChevronDown size={15} />
            </button>
            {carreraOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 max-h-60 w-64 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                {careers.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">Sin carreras registradas</p>
                ) : (
                  careers.map((c) => (
                    <button
                      key={c.career_id}
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
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition"
            style={{ backgroundColor: hasActiveElection && selectedCareer ? BRAND : "#9ca3af" }}
          >
            Simular
          </button>

          <div className="relative">
            <button
              onClick={() => { setActionsOpen((p) => !p); setCarreraOpen(false) }}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300"
            >
              Acciones <ChevronDown size={15} />
            </button>
            {accionesOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-gray-100 bg-white shadow-lg">
                <button className="block w-full rounded-t-xl px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">Exportar datos</button>
                <button className="block w-full rounded-b-xl px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">Ver historial</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-full overflow-x-auto pb-1 sm:w-fit sm:pb-0">
        <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 shadow-sm whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
              style={
                activeTab === tab.id
                  ? { backgroundColor: BRAND, color: "#ffffff" }
                  : { color: BRAND }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && (
        !hasActiveElection ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
            <div className="flex flex-col items-center gap-4 px-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: "#EDF0F5" }}>
                <Landmark size={32} style={{ color: BRAND }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: BRAND }}>
                  {elections.length === 0 ? "Aún no hay elecciones" : "No hay elecciones activas"}
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  {elections.length === 0
                    ? "Crea una nueva elección para empezar"
                    : `Tienes ${elections.length} elección(es) en total. Activa una para ver el dashboard.`}
                </p>
              </div>
              <button
                onClick={() => navigate("/admin/elecciones/wizard?step=1")}
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                <Plus size={16} />
                Nueva Elección
              </button>
              {elections.length > 0 && (
                <button
                  onClick={() => navigate("/admin/elecciones/detalles")}
                  className="text-sm font-medium underline-offset-2 hover:underline"
                  style={{ color: BRAND }}
                >
                  Ver todas las elecciones
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Proyección estadística */}
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: BRAND }}>Proyección de Resultados</p>
                    <p className="text-xs text-gray-400">Pronóstico estadístico en tiempo real</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "#EDF0F5", color: BRAND }}>
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
                      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Planilla líder</span>
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        style={{ backgroundColor: "#EDF0F5", color: BRAND }}>
                        {prediction.confidence_label}
                      </span>
                    </div>
                    <div className="flex items-end justify-between">
                      <p className="text-lg font-bold" style={{ color: BRAND }}>
                        {prediction.projected_winner?.name ?? "—"}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: ACCENT }}>
                        {prediction.projected_winner ? pct(prediction.projected_winner.win_probability) : "—"}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">Margen</p>
                        <p className="text-sm font-semibold text-gray-700">{pct(prediction.margin)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">2.º lugar</p>
                        <p className="truncate text-sm font-semibold text-gray-700">{prediction.runner_up?.name ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400">Pendientes</p>
                        <p className="text-sm font-semibold text-gray-700">{prediction.remaining_voters}</p>
                      </div>
                    </div>
                    {prediction.anomalies.length > 0 && (
                      <div className="mt-2 space-y-1 rounded-xl bg-amber-50 p-3">
                        {prediction.anomalies.slice(0, 3).map((a, i) => (
                          <p key={i} className="flex items-start gap-1.5 text-xs text-amber-700">
                            <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                            <span><strong>{a.label}:</strong> {a.note}</span>
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
                    <p className="text-sm font-semibold" style={{ color: BRAND }}>Resumen Ejecutivo (IA)</p>
                    <p className="text-xs text-gray-400">Análisis generado por el asistente</p>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "#EDF0F5", color: BRAND }}>
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
                ) : insights ? (
                  <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
                    {renderSummary(insights.summary)}
                  </div>
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
                yLabels={["200", "150", "100", "50", "0"]}
                xLabels={["08:00", "10:00", "12:00", "14:00", "16:00"]}
                chart={<LineChart />}
              />
              <ChartCard
                title="Votos por Carrera"
                subtitle="Facultades con mayor participación"
                icon={<GraduationCap size={18} />}
                yLabels={["200", "150", "100", "50", "0"]}
                xLabels={careers.slice(0, 3).map((c) => c.code)}
                chart={<BarChartSvg />}
              />
            </div>
            <ChartCard
              title="Distribución de Votos: Carrera y Planilla"
              subtitle="Preferencias de asociación por facultad"
              icon={<BarChart2 size={18} />}
              yLabels={["200", "150", "100", "50", "0"]}
              xLabels={careers.slice(0, 3).map((c) => c.name.split(" ").slice(0, 2).join(" "))}
              chart={<StackedBarChartSvg />}
            />
          </div>
        )
      )}

      {activeTab === "ranking" && (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
          <p className="text-sm text-gray-400">Ranking de Planillas — próximamente</p>
        </div>
      )}

      {activeTab === "escrutinio" && (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
          <p className="text-sm text-gray-400">Tabla de Escrutinio — próximamente</p>
        </div>
      )}
    </AdminLayout>
  )
}
