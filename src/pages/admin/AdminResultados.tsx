import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import { ForecastPanel } from "@/components/ForecastPanel"
import { StatCard } from "@/components/StatCard"
import { TabBar } from "@/components/TabBar"
import { useAuth } from "@/context/AuthContext"
import { useClickOutside } from "@/lib/useClickOutside"
import {
  getElections,
  getDashboard,
  getPrediction,
  getInsights,
  type DashboardData,
  type Prediction,
  type Insights,
  type ElectionSummary,
  type HourlyPoint,
  type CareerBreakdown,
  type AssociationTally,
} from "@/services/results.service"
import { listOrganizations, type ApiOrganization } from "@/services/admin.service"
import {
  ELECTION_STATUS_LABELS,
  ELECTION_STATUS_COLORS,
  formatPercent,
  renderMarkdown,
  toPercent,
} from "@/lib/elections"
import { BRAND, ACCENT } from "@/lib/brand"
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  ChevronDown,
  Clock,
  GraduationCap,
  LayoutDashboard,
  ListOrdered,
  Loader2,
  FileText,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Trophy,
  Users,
  XCircle,
} from "lucide-react"

// ─── Color palette for associations ──────────────────────────────────────────

const ASSOC_COLORS = [
  BRAND, ACCENT, "#1D4ED8", "#7C3AED", "#0891B2", "#059669", "#DC2626", "#D97706",
]

function assocColor(i: number) {
  return ASSOC_COLORS[i % ASSOC_COLORS.length]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CardHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: BRAND }}>{title}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-light" style={{ color: BRAND }}>
        {icon}
      </div>
    </div>
  )
}

/** Donut gauge for overall turnout */
function TurnoutGauge({ percent, size = 140 }: { percent: number; size?: number }) {
  const r = size / 2 - 14
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * r
  const filled = Math.min(percent / 100, 1)
  const dash = filled * circumference
  const color = percent >= 70 ? "#16A34A" : percent >= 40 ? ACCENT : "#F59E0B"

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E5E7EB" strokeWidth="12" />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none" stroke={color} strokeWidth="12"
        strokeDasharray={`${dash} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="800" fill={BRAND}>
        {percent.toFixed(1)}%
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9CA3AF">
        participación
      </text>
    </svg>
  )
}

/** Horizontal bar for an association with rank + name + votes + share */
function AssocBar({
  assoc,
  rank,
  color,
  share,
  totalVotes,
  isLeader,
  compact = false,
}: {
  assoc: AssociationTally
  rank: number
  color: string
  share: number
  totalVotes: number
  isLeader: boolean
  compact?: boolean
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {isLeader ? <Trophy size={11} /> : rank}
          </span>
          <span className={`truncate font-medium text-gray-800 ${compact ? "text-xs" : "text-sm"}`}>
            {assoc.name}
          </span>
          {isLeader && !compact && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: ACCENT }}>
              LÍDER
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-right">
          <span className={`font-bold ${compact ? "text-sm" : "text-base"}`} style={{ color }}>
            {assoc.votes}
          </span>
          <span className="text-xs text-gray-400">{formatPercent(share)}</span>
        </div>
      </div>
      <div className={`w-full rounded-full bg-gray-100 ${compact ? "h-2" : "h-2.5"}`}>
        <div
          className={`rounded-full transition-all duration-500 ${compact ? "h-2" : "h-2.5"}`}
          style={{ width: `${Math.max(share, 0)}%`, backgroundColor: color }}
        />
      </div>
      {!compact && totalVotes === 0 && (
        <p className="mt-1 text-right text-[10px] text-gray-300">Sin votos aún</p>
      )}
    </div>
  )
}

/** HourlyChart — SVG line chart */
function HourlyChart({ data }: { data: HourlyPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50">
        <p className="text-sm text-gray-400">Sin datos de participación por hora</p>
      </div>
    )
  }
  const W = 380; const H = 180
  const PAD = { top: 12, right: 10, bottom: 30, left: 32 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const maxVal = Math.max(...data.map((d) => d.cumulative), 1)
  const GRID = 4

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: PAD.top + (1 - d.cumulative / maxVal) * chartH,
    d,
  }))

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const area = pts.length > 1
    ? `${line} L ${pts[pts.length - 1].x} ${PAD.top + chartH} L ${pts[0].x} ${PAD.top + chartH} Z`
    : ""

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {Array.from({ length: GRID + 1 }).map((_, i) => {
        const frac = i / GRID
        const y = PAD.top + frac * chartH
        return (
          <g key={i}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
            <text x={PAD.left - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
              {Math.round(maxVal * (1 - frac))}
            </text>
          </g>
        )
      })}
      {area && <path d={area} fill={ACCENT} fillOpacity="0.08" />}
      <path d={line} fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={ACCENT} stroke="white" strokeWidth="1.5" />
      ))}
      {pts.map((p, i) => {
        if (data.length > 8 && i % 2 !== 0) return null
        return (
          <text key={i} x={p.x} y={H - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">
            {p.d.label}
          </text>
        )
      })}
    </svg>
  )
}

/** Mini progress bar for career cards */
function MiniBar({ percent, color = ACCENT }: { percent: number; color?: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100">
      <div
        className="h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
      />
    </div>
  )
}

// ─── Career-by-career view ────────────────────────────────────────────────────

interface CareerViewProps {
  dashboard: DashboardData
  prediction: Prediction | null
}

function CareerView({ dashboard, prediction }: CareerViewProps) {
  const [selectedCareer, setSelectedCareer] = useState<CareerBreakdown | null>(null)

  const assocByCareer = useMemo(() => {
    const map: Record<string, AssociationTally[]> = {}
    for (const a of dashboard.by_association) {
      const key = a.career_id ?? "__none__"
      if (!map[key]) map[key] = []
      map[key].push(a)
    }
    return map
  }, [dashboard.by_association])

  // ── Detail view ────────────────────────────────────────────────────────────
  if (selectedCareer) {
    const career = selectedCareer
    const assocs = (assocByCareer[career.career_id] ?? []).slice().sort((a, b) => b.votes - a.votes)
    const totalCareerVotes = assocs.reduce((s, a) => s + a.votes, 0)
    const tp = toPercent(career.turnout)
    const color = tp >= 70 ? "#16A34A" : tp >= 40 ? ACCENT : "#F59E0B"
    const leaderId = assocs[0]?.association_id

    // find projection for each assoc
    const projMap = new Map(prediction?.projection?.map((p) => [p.association_id, p]) ?? [])

    return (
      <div className="space-y-5">
        {/* Back */}
        <button
          onClick={() => setSelectedCareer(null)}
          className="flex items-center gap-1.5 text-sm text-gray-500 transition hover:text-gray-800"
        >
          <ArrowLeft size={16} />
          Todas las carreras
        </button>

        {/* Career hero */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-bold text-white text-lg"
              style={{ backgroundColor: BRAND }}
            >
              {career.career_code}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold" style={{ color: BRAND }}>{career.career_name}</h2>
              <p className="text-xs text-gray-400">{career.career_code}</p>
            </div>
            <div className="flex shrink-0 flex-col items-center">
              <TurnoutGauge percent={tp} size={120} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Elegibles</p>
              <p className="text-2xl font-bold" style={{ color: BRAND }}>{career.eligible}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Votaron</p>
              <p className="text-2xl font-bold text-green-600">{career.voted}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Pendientes</p>
              <p className="text-2xl font-bold text-amber-600">{career.eligible - career.voted}</p>
            </div>
          </div>
          <div className="mt-3 h-2.5 w-full rounded-full bg-gray-100">
            <div
              className="h-2.5 rounded-full transition-all duration-700"
              style={{ width: `${tp}%`, backgroundColor: color }}
            />
          </div>
        </div>

        {/* Associations in this career */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <CardHeader
            title={`Planillas — ${career.career_name}`}
            subtitle={`${assocs.length} planilla${assocs.length !== 1 ? "s" : ""} compitiendo en esta carrera`}
            icon={<Trophy size={18} />}
          />

          {assocs.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              Sin planillas registradas en esta carrera
            </p>
          ) : totalCareerVotes === 0 ? (
            <div className="space-y-4">
              {assocs.map((a, i) => (
                <div key={a.association_id} className="rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: assocColor(i) }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{a.name}</span>
                    <span className="ml-auto text-xs text-gray-400">Sin votos aún</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-5">
              {assocs.map((a, i) => {
                const isLeader = a.association_id === leaderId
                const careerShare = totalCareerVotes > 0 ? (a.votes / totalCareerVotes) * 100 : 0
                const color = assocColor(i)
                const proj = projMap.get(a.association_id)
                return (
                  <div
                    key={a.association_id}
                    className="rounded-xl p-4"
                    style={{
                      border: isLeader ? `2px solid ${ACCENT}` : "1px solid #F3F4F6",
                      backgroundColor: isLeader ? "#F0FEFF" : "#FAFAFA",
                    }}
                  >
                    <AssocBar
                      assoc={a}
                      rank={i + 1}
                      color={color}
                      share={careerShare}
                      totalVotes={totalCareerVotes}
                      isLeader={isLeader}
                    />
                    {proj && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs text-gray-500">
                        <TrendingUp size={12} style={{ color: BRAND }} />
                        Proyección: <strong className="text-gray-700">{proj.projected_votes_low}–{proj.projected_votes_high}</strong> votos estimados
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Grid: all careers ─────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-light" style={{ color: BRAND }}>
          <GraduationCap size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: BRAND }}>
            {dashboard.by_career.length} carrera{dashboard.by_career.length !== 1 ? "s" : ""} participando
          </p>
          <p className="text-xs text-gray-400">Haz clic en una carrera para ver el detalle</p>
        </div>
      </div>

      {dashboard.by_career.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white shadow-sm">
          <p className="text-sm text-gray-400">Sin datos de carreras</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dashboard.by_career
            .slice()
            .sort((a, b) => b.turnout - a.turnout)
            .map((career) => {
              const tp = toPercent(career.turnout)
              const color = tp >= 70 ? "#16A34A" : tp >= 40 ? ACCENT : "#F59E0B"
              const assocs = assocByCareer[career.career_id] ?? []
              const totalVotes = assocs.reduce((s, a) => s + a.votes, 0)

              return (
                <button
                  key={career.career_id}
                  onClick={() => setSelectedCareer(career)}
                  className="flex flex-col gap-3 rounded-2xl bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight" style={{ color: BRAND }}>
                        {career.career_name}
                      </p>
                      <p className="text-xs text-gray-400">{career.career_code}</p>
                    </div>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: color + "22", color }}
                    >
                      {tp.toFixed(0)}%
                    </span>
                  </div>

                  {/* Turnout bar */}
                  <MiniBar percent={tp} color={color} />

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-gray-400">Elegibles</p>
                      <p className="text-sm font-semibold text-gray-700">{career.eligible}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-400">Votaron</p>
                      <p className="text-sm font-semibold text-green-600">{career.voted}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-400">Planillas</p>
                      <p className="text-sm font-semibold" style={{ color: BRAND }}>
                        {assocs.length}
                      </p>
                    </div>
                  </div>

                  {/* Association mini-bars */}
                  {assocs.length > 0 && totalVotes > 0 && (
                    <div className="space-y-1.5 border-t border-gray-100 pt-3">
                      {assocs
                        .slice()
                        .sort((a, b) => b.votes - a.votes)
                        .map((a, i) => {
                          const share = (a.votes / totalVotes) * 100
                          return (
                            <div key={a.association_id} className="flex items-center gap-2">
                              <span className="w-24 truncate text-[10px] text-gray-500">{a.name}</span>
                              <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                                <div
                                  className="h-1.5 rounded-full"
                                  style={{ width: `${share}%`, backgroundColor: assocColor(i) }}
                                />
                              </div>
                              <span className="w-8 text-right text-[10px] font-medium text-gray-500">
                                {a.votes}
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminResultados() {
  const { token } = useAuth()

  const [elections, setElections] = useState<ElectionSummary[]>([])
  const [organizations, setOrganizations] = useState<ApiOrganization[]>([])
  const [selectedOrg, setSelectedOrg] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [elecOpen, setElecOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [prediction, setPrediction] = useState<Prediction | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)

  const [loadingElections, setLoadingElections] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("resumen")

  const elecRef = useClickOutside<HTMLDivElement>(useCallback(() => setElecOpen(false), []))

  // Load organizations for campus filter
  useEffect(() => {
    if (!token) return
    listOrganizations(token).then(setOrganizations).catch(() => {})
  }, [token])

  // Load elections list
  useEffect(() => {
    if (!token) return
    getElections(token)
      .then((elecs) => {
        setElections(elecs)
        setFetchError(null)
        const best =
          elecs.find((e) => e.status === "open") ??
          elecs.find((e) => e.status === "closed") ??
          elecs[0] ?? null
        if (best) setSelectedId(best.election_id)
      })
      .catch((e) => setFetchError(e instanceof Error ? e.message : "Error al cargar las elecciones"))
      .finally(() => setLoadingElections(false))
  }, [token])

  // Load data when election or refresh changes
  useEffect(() => {
    if (!selectedId || !token) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingData(true)
    setDashboard(null)
    setPrediction(null)

    Promise.all([getDashboard(selectedId, token), getPrediction(selectedId, token)])
      .then(([dash, pred]) => { setDashboard(dash); setPrediction(pred) })
      .catch((e) => setFetchError(e instanceof Error ? e.message : "Error al cargar los resultados"))
      .finally(() => setLoadingData(false))

    setLoadingAI(true)
    getInsights(selectedId, token)
      .then((ins) => { setInsights(ins); setAiError(null) })
      .catch((e) => setAiError(e?.message ?? "No se pudo generar el resumen"))
      .finally(() => setLoadingAI(false))
  }, [selectedId, token, refreshKey])

  const selectedElection = useMemo(
    () => elections.find((e) => e.election_id === selectedId) ?? null,
    [elections, selectedId],
  )

  const renderedSummary = useMemo(
    () => (insights ? renderMarkdown(insights.summary) : null),
    [insights],
  )

  const tabs = [
    { id: "resumen",   label: "Resumen",     icon: <LayoutDashboard size={14} /> },
    { id: "carreras",  label: "Por Carrera",  icon: <GraduationCap size={14} /> },
    { id: "planillas", label: "Planillas",    icon: <ListOrdered size={14} /> },
    { id: "pronostico", label: "Pronóstico",  icon: <TrendingUp size={14} /> },
    { id: "escrutinio", label: "Escrutinio",  icon: <FileText size={14} /> },
  ]

  if (loadingElections) {
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
      {/* ── Page header ── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Resultados</h1>
          <p className="mt-1 text-sm text-gray-500">
            {selectedElection
              ? `${selectedElection.title} — ${ELECTION_STATUS_LABELS[selectedElection.status] ?? selectedElection.status}`
              : "Selecciona una elección para ver sus resultados"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {selectedElection && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: ELECTION_STATUS_COLORS[selectedElection.status] ?? "#475569" }}
            >
              {ELECTION_STATUS_LABELS[selectedElection.status] ?? selectedElection.status}
            </span>
          )}

          {selectedId && (
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              disabled={loadingData}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition hover:border-gray-300 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loadingData ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          )}

          {/* Campus filter */}
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm outline-none focus:border-blue-400"
          >
            <option value="">Todos los campus</option>
            {organizations.map((o) => (
              <option key={o.organization_id} value={o.organization_id}>{o.name}</option>
            ))}
          </select>

          {/* Election picker */}
          <div ref={elecRef} className="relative">
            <button
              onClick={() => setElecOpen((p) => !p)}
              aria-haspopup="listbox"
              aria-expanded={elecOpen}
              className="flex min-w-[200px] items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition hover:border-gray-300"
            >
              <span className="flex-1 truncate text-left">
                {selectedElection?.title ?? "Seleccionar elección"}
              </span>
              <ChevronDown size={14} className="shrink-0" />
            </button>
            {elecOpen && (
              <div
                role="listbox"
                aria-label="Seleccionar elección"
                className="absolute right-0 top-full z-20 mt-1 max-h-64 w-72 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-xl"
              >
                {elections.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">Sin elecciones registradas</p>
                ) : (
                  (selectedOrg ? elections.filter((e) => e.organization_id === selectedOrg) : elections).map((e) => (
                    <button
                      key={e.election_id}
                      role="option"
                      aria-selected={selectedId === e.election_id}
                      onClick={() => {
                        setSelectedId(e.election_id)
                        setElecOpen(false)
                        setActiveTab("resumen")
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <span className="truncate">{e.title}</span>
                      <span
                        className="ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: ELECTION_STATUS_COLORS[e.status] ?? "#475569" }}
                      >
                        {ELECTION_STATUS_LABELS[e.status] ?? e.status}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {fetchError && (
        <div className="mb-5 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {fetchError}
        </div>
      )}

      {elections.length === 0 && (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3 px-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-light">
              <BarChart2 size={28} style={{ color: BRAND }} />
            </div>
            <p className="font-semibold" style={{ color: BRAND }}>Sin elecciones registradas</p>
            <p className="text-sm text-gray-400">Crea una elección para comenzar a ver resultados</p>
          </div>
        </div>
      )}

      {elections.length > 0 && (
        <>
          <TabBar tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {loadingData ? (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <Loader2 size={28} className="animate-spin" />
                <span className="text-sm">Cargando resultados…</span>
              </div>
            </div>
          ) : !dashboard ? (
            <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm">
              <p className="text-sm text-gray-400">Selecciona una elección para ver los resultados</p>
            </div>
          ) : (
            <>
              {/* ══════════════════════════════════════════════════════════
                  TAB: RESUMEN
              ══════════════════════════════════════════════════════════ */}
              {activeTab === "resumen" && (
                <div className="space-y-5">
                  {/* Hero row: gauge + stat cards */}
                  <div className="flex flex-wrap gap-5">
                    {/* Donut gauge */}
                    <div className="flex items-center justify-center rounded-2xl bg-white p-5 shadow-sm">
                      <TurnoutGauge percent={toPercent(dashboard.totals.turnout)} />
                    </div>

                    {/* Stat cards grid */}
                    <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-3">
                      <StatCard label="Elegibles"    value={dashboard.totals.eligible}    icon={<Users size={15} />}       color={BRAND} />
                      <StatCard label="Votaron"      value={dashboard.totals.voted}        icon={<CheckCircle2 size={15} />} color="#16A34A" />
                      <StatCard label="Pendientes"   value={dashboard.totals.pending}      icon={<Clock size={15} />}       color="#A16207" />
                      <StatCard label="Votos válidos" value={dashboard.totals.valid_votes} icon={<BarChart2 size={15} />}   color="#1D4ED8" />
                      <StatCard label="En blanco"    value={dashboard.totals.blank_votes}  icon={<XCircle size={15} />}     color="#94A3B8" />
                      <StatCard label="Participación" value={formatPercent(dashboard.totals.turnout)} icon={<TrendingUp size={15} />} color={ACCENT} />
                    </div>
                  </div>

                  {/* Association bars + Hourly chart */}
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <CardHeader
                        title="Votos por Planilla"
                        subtitle="Distribución actual en toda la elección"
                        icon={<Trophy size={18} />}
                      />
                      {dashboard.by_association.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-400">Sin votos registrados aún</p>
                      ) : (
                        <div className="space-y-4">
                          {dashboard.by_association.map((a, i) => (
                            <AssocBar
                              key={a.association_id}
                              assoc={a}
                              rank={i + 1}
                              color={assocColor(i)}
                              share={toPercent(a.share)}
                              totalVotes={dashboard.totals.valid_votes}
                              isLeader={i === 0}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                      <CardHeader
                        title="Participación por Hora"
                        subtitle="Votos acumulados durante la jornada"
                        icon={<TrendingUp size={18} />}
                      />
                      <HourlyChart data={dashboard.turnout_by_hour} />
                    </div>
                  </div>

                  {/* AI Summary */}
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <CardHeader
                      title="Resumen Ejecutivo (IA)"
                      subtitle="Análisis generado automáticamente por el asistente"
                      icon={<Sparkles size={18} />}
                    />
                    {loadingAI ? (
                      <div className="flex h-24 flex-col items-center justify-center gap-2 text-gray-400">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-xs">Generando análisis…</span>
                      </div>
                    ) : aiError ? (
                      <p className="py-6 text-center text-sm text-gray-400">{aiError}</p>
                    ) : renderedSummary ? (
                      <div className="max-h-72 space-y-1 overflow-y-auto pr-1">{renderedSummary}</div>
                    ) : (
                      <p className="py-6 text-center text-sm text-gray-400">Sin datos para analizar.</p>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  TAB: POR CARRERA
              ══════════════════════════════════════════════════════════ */}
              {activeTab === "carreras" && (
                <CareerView dashboard={dashboard} prediction={prediction} />
              )}

              {/* ══════════════════════════════════════════════════════════
                  TAB: PLANILLAS
              ══════════════════════════════════════════════════════════ */}
              {activeTab === "planillas" && (
                <div className="space-y-4">
                  {/* Prediction banner */}
                  {prediction?.has_enough_data && prediction.projected_winner && (
                    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 shadow-sm">
                      <Trophy size={18} className="shrink-0 text-green-700" />
                      <span className="text-sm font-semibold text-green-800">
                        Líder proyectado: {prediction.projected_winner.name}
                      </span>
                      <span className="rounded-full bg-green-200 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {prediction.confidence_label}
                      </span>
                      <span className="ml-auto text-xs text-green-700">
                        Probabilidad: <strong>{formatPercent(prediction.projected_winner.win_probability)}</strong>
                      </span>
                    </div>
                  )}

                  {dashboard.by_association.length === 0 ? (
                    <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-white shadow-sm">
                      <p className="text-sm text-gray-400">Sin votos registrados aún</p>
                    </div>
                  ) : (
                    dashboard.by_association.map((assoc, i) => {
                      const color = assocColor(i)
                      const isLeader = i === 0
                      const proj = prediction?.projection?.find(
                        (p) => p.association_id === assoc.association_id,
                      )
                      const share = toPercent(assoc.share)

                      return (
                        <div
                          key={assoc.association_id}
                          className="overflow-hidden rounded-2xl bg-white shadow-sm"
                          style={{ borderLeft: `5px solid ${isLeader ? ACCENT : color}` }}
                        >
                          <div className="flex flex-wrap items-start gap-4 p-5">
                            {/* Rank avatar */}
                            <div
                              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-bold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {isLeader ? <Trophy size={22} /> : <span className="text-xl">{i + 1}</span>}
                            </div>

                            {/* Name + bar */}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <p className="text-base font-bold" style={{ color: BRAND }}>{assoc.name}</p>
                                {isLeader && (
                                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ backgroundColor: ACCENT }}>
                                    LÍDER
                                  </span>
                                )}
                                {assoc.career_name && (
                                  <span className="text-xs text-gray-400">{assoc.career_name}</span>
                                )}
                              </div>
                              <div className="h-3 w-full rounded-full bg-gray-100">
                                <div
                                  className="h-3 rounded-full transition-all duration-700"
                                  style={{ width: `${share}%`, backgroundColor: color }}
                                />
                              </div>
                            </div>

                            {/* Vote + share numbers */}
                            <div className="flex shrink-0 items-start gap-6 text-right">
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">Votos</p>
                                <p className="text-3xl font-bold" style={{ color }}>{assoc.votes}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase tracking-wide text-gray-400">Cuota</p>
                                <p className="text-3xl font-bold text-gray-700">{formatPercent(assoc.share)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Projection row */}
                          {proj && (
                            <div className="flex items-center gap-2 border-t border-gray-100 bg-gray-50 px-5 py-2.5 text-xs text-gray-600">
                              <TrendingUp size={12} style={{ color: BRAND }} />
                              Proyección final:{" "}
                              <strong className="text-gray-800">{proj.projected_votes_low}–{proj.projected_votes_high}</strong>{" "}
                              votos
                              {prediction?.runner_up?.association_id === assoc.association_id && (
                                <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-gray-600">
                                  2.° lugar
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}

                  {/* Anomalies */}
                  {prediction && prediction.anomalies.length > 0 && (
                    <div className="rounded-2xl bg-amber-50 p-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600" />
                        <p className="text-sm font-semibold text-amber-700">Anomalías detectadas en la participación</p>
                      </div>
                      <div className="space-y-2">
                        {prediction.anomalies.map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-700">
                            <span className="mt-0.5 shrink-0 font-semibold">{a.label}:</span>
                            <span>{a.note}</span>
                            <span className="ml-auto shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-mono text-amber-600">
                              z={a.z_score}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════════════════════════════════════════════════════
                  TAB: PRONÓSTICO
              ══════════════════════════════════════════════════════════ */}
              {activeTab === "pronostico" && selectedId && token && (
                <ForecastPanel electionId={selectedId} token={token} refreshKey={refreshKey} />
              )}

              {/* ══════════════════════════════════════════════════════════
                  TAB: ESCRUTINIO
              ══════════════════════════════════════════════════════════ */}
              {activeTab === "escrutinio" && (
                <div className="space-y-5">
                  {/* Career table */}
                  <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: BRAND }}>Escrutinio por Carrera</p>
                        <p className="text-xs text-gray-400">Participación detallada por facultad</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-light" style={{ color: BRAND }}>
                        <GraduationCap size={18} />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[580px]">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Carrera</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Elegibles</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Votaron</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Pendientes</th>
                            <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Participación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {dashboard.by_career.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">Sin datos de carreras</td>
                            </tr>
                          ) : (
                            dashboard.by_career
                              .slice()
                              .sort((a, b) => b.voted - a.voted)
                              .map((c) => {
                                const tp = toPercent(c.turnout)
                                const barColor = tp >= 70 ? "#16A34A" : tp >= 40 ? ACCENT : "#F59E0B"
                                return (
                                  <tr key={c.career_id} className="transition-colors hover:bg-gray-50">
                                    <td className="px-5 py-3">
                                      <p className="text-sm font-medium text-gray-800">{c.career_name}</p>
                                      <p className="text-xs text-gray-400">{c.career_code}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600">{c.eligible}</td>
                                    <td className="px-4 py-3 text-right text-sm font-semibold text-green-600">{c.voted}</td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-400">{c.eligible - c.voted}</td>
                                    <td className="px-5 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className="h-2 flex-1 rounded-full bg-gray-100">
                                          <div
                                            className="h-2 rounded-full transition-all"
                                            style={{ width: `${tp}%`, backgroundColor: barColor }}
                                          />
                                        </div>
                                        <span className="w-12 shrink-0 text-right text-xs font-semibold text-gray-700">
                                          {tp.toFixed(1)}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })
                          )}
                        </tbody>
                        {dashboard.by_career.length > 0 && (
                          <tfoot>
                            <tr className="border-t-2 border-gray-200 bg-slate-50">
                              <td className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-500">Total</td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-gray-800">{dashboard.totals.eligible}</td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-green-600">{dashboard.totals.voted}</td>
                              <td className="px-4 py-3 text-right text-sm font-bold text-gray-500">{dashboard.totals.pending}</td>
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                                    <div
                                      className="h-2 rounded-full"
                                      style={{ width: `${toPercent(dashboard.totals.turnout)}%`, backgroundColor: BRAND }}
                                    />
                                  </div>
                                  <span className="w-12 shrink-0 text-right text-xs font-bold" style={{ color: BRAND }}>
                                    {toPercent(dashboard.totals.turnout).toFixed(1)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>

                  {/* Horizontal bar chart by association */}
                  <div className="rounded-2xl bg-white p-5 shadow-sm">
                    <CardHeader
                      title="Distribución de Votos por Planilla"
                      subtitle="Vista comparativa de todas las planillas"
                      icon={<BarChart2 size={18} />}
                    />
                    {dashboard.by_association.length === 0 ? (
                      <p className="py-8 text-center text-sm text-gray-400">Sin votos registrados aún</p>
                    ) : (
                      <div className="space-y-3">
                        {dashboard.by_association.map((a, i) => {
                          const color = assocColor(i)
                          const share = toPercent(a.share)
                          return (
                            <div key={a.association_id} className="flex items-center gap-3">
                              <div className="w-28 min-w-0 shrink-0 sm:w-40">
                                <p className="truncate text-xs font-medium text-gray-700">{a.name}</p>
                                {a.career_name && (
                                  <p className="truncate text-[10px] text-gray-400">{a.career_name}</p>
                                )}
                              </div>
                              <div className="h-7 flex-1 overflow-hidden rounded-lg bg-gray-100">
                                <div
                                  className="flex h-7 items-center rounded-lg px-2 transition-all duration-500"
                                  style={{ width: `${share}%`, backgroundColor: color, minWidth: a.votes > 0 ? "32px" : "0" }}
                                >
                                  {a.votes > 0 && (
                                    <span className="text-[10px] font-bold text-white">{a.votes}</span>
                                  )}
                                </div>
                              </div>
                              <span className="w-12 shrink-0 text-right text-xs font-semibold text-gray-600">
                                {formatPercent(a.share)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </AdminLayout>
  )
}
