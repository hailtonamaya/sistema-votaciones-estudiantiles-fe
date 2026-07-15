import { useEffect, useState, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiElection,
  type ElectionStatus,
  getElection,
  listAssociations,
  listVoters,
  transitionElection,
  updateElection,
} from "@/services/admin.service"
import { BRAND } from "@/lib/brand"
import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  ArrowLeft,
  BarChart2,
  CalendarClock,
  Calendar,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Lock,
  Loader2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  StopCircle,
  Users,
  Vote,
} from "lucide-react"

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ElectionStatus, { label: string; bg: string; color: string }> = {
  open:      { label: "Activa",     bg: "#DCFCE7", color: "#16A34A" },
  paused:    { label: "Pausada",    bg: "#FEE2E2", color: "#DC2626" },
  closed:    { label: "Finalizada", bg: "#E2E8F0", color: "#475569" },
  draft:     { label: "Borrador",   bg: "#FEF9C3", color: "#A16207" },
  scheduled: { label: "Programada", bg: "#DBEAFE", color: "#1D4ED8" },
  cancelled: { label: "Archivada",  bg: "#F1F5F9", color: "#94A3B8" },
}

// Primary action buttons per status
const TRANSITIONS: Record<ElectionStatus, Array<{ value: ElectionStatus; label: string; color: string; Icon: LucideIcon }>> = {
  draft:     [
    { value: "scheduled", label: "Programar",     color: "#1D4ED8", Icon: CalendarClock },
    { value: "open",      label: "Activar ahora", color: "#16A34A", Icon: PlayCircle   },
  ],
  scheduled: [
    { value: "open",  label: "Iniciar ahora",     color: "#16A34A", Icon: PlayCircle },
    { value: "draft", label: "Volver a borrador", color: "#A16207", Icon: RotateCcw  },
  ],
  open:      [
    { value: "paused", label: "Pausar", color: "#D97706", Icon: PauseCircle },
    { value: "closed", label: "Cerrar", color: "#475569", Icon: StopCircle  },
  ],
  paused:    [
    { value: "open",   label: "Reanudar", color: "#16A34A", Icon: PlayCircle },
    { value: "closed", label: "Cerrar",   color: "#475569", Icon: StopCircle },
  ],
  closed:    [],
  cancelled: [{ value: "draft", label: "Restaurar", color: BRAND, Icon: RotateCcw }],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null, opts: Intl.DateTimeFormatOptions): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-HN", opts)
}
const fmtDate = (iso: string | null) =>
  fmt(iso, { day: "numeric", month: "short", year: "numeric" })
const fmtTime = (iso: string | null) =>
  fmt(iso, { hour: "numeric", minute: "2-digit", hour12: true })

/** Convert a datetime-local string (local time) to ISO UTC */
function localToIso(local: string): string {
  return new Date(local).toISOString()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-800">{value}</span>
    </div>
  )
}

function SectionCard({
  icon, title, badge, editLabel = "Editar", onEdit, children,
}: {
  icon: ReactNode; title: string; badge?: string
  editLabel?: string; onEdit: () => void; children: ReactNode
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          {icon}
          <h2 className="text-sm font-semibold" style={{ color: BRAND }}>{title}</h2>
          {badge && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
              {badge}
            </span>
          )}
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          {editLabel}<ChevronRight size={12} />
        </button>
      </div>
      <div className="flex-1 px-5 py-4">{children}</div>
    </div>
  )
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold" style={{ color: BRAND }}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminEleccionEditar() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const electionId = searchParams.get("id") ?? ""

  const [election, setElection] = useState<ApiElection | null>(null)
  const [assocCount, setAssocCount] = useState(0)
  const [candidateCount, setCandidateCount] = useState(0)
  const [voterCount, setVoterCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const [transitioning, setTransitioning] = useState<ElectionStatus | null>(null)
  const [transitionError, setTransitionError] = useState<string | null>(null)

  // Postpone (reschedule) state — only relevant for "scheduled" elections
  const [postponeMode, setPostponeMode] = useState(false)
  const [newStartAt, setNewStartAt] = useState("")
  const [postponing, setPostponing] = useState(false)
  const [postponeError, setPostponeError] = useState<string | null>(null)

  useEffect(() => {
    if (!electionId || !token) return
    Promise.allSettled([
      getElection(token, electionId),
      listAssociations(token, { election_id: electionId }),
      listVoters(token, electionId),
    ])
      .then(([elRes, assocRes, voterRes]) => {
        if (elRes.status === "fulfilled") setElection(elRes.value)
        if (assocRes.status === "fulfilled") {
          setAssocCount(assocRes.value.length)
          setCandidateCount(assocRes.value.reduce((sum, a) => sum + (a.association_member?.length ?? 0), 0))
        }
        if (voterRes.status === "fulfilled") setVoterCount(voterRes.value.length)
      })
      .finally(() => setLoading(false))
  }, [electionId, token])

  async function handleTransition(nextStatus: ElectionStatus, label: string) {
    if (!confirm(`¿${label} la elección "${election?.title}"?`)) return
    setTransitionError(null)
    setTransitioning(nextStatus)
    try {
      const updated = await transitionElection(token!, electionId, nextStatus)
      setElection(updated)
    } catch (e) {
      setTransitionError(e instanceof Error ? e.message : "Error al cambiar el estado")
    } finally {
      setTransitioning(null)
    }
  }

  async function handlePostpone() {
    if (!newStartAt) return
    setPostponeError(null)
    setPostponing(true)
    try {
      const updated = await updateElection(token!, electionId, { start_at: localToIso(newStartAt) })
      setElection(updated)
      setPostponeMode(false)
      setNewStartAt("")
    } catch (e) {
      setPostponeError(e instanceof Error ? e.message : "Error al reprogramar")
    } finally {
      setPostponing(false)
    }
  }

  function goToStep(step: number) {
    navigate(`/admin/elecciones/wizard?id=${electionId}&step=${step}&from=edit`)
  }

  const status = election ? STATUS_CFG[election.status] : null
  const nextTransitions = election ? TRANSITIONS[election.status] : []
  const canEdit =
    election?.status === "draft" ||
    election?.status === "scheduled" ||
    election?.status === "paused"

  return (
    <AdminLayout>
      <button
        onClick={() => navigate("/admin/elecciones/detalles")}
        className="mb-5 flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-800"
      >
        <ArrowLeft size={14} />
        Volver a Elecciones
      </button>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : !election ? (
        <p className="text-sm text-red-500">Elección no encontrada.</p>
      ) : (
        <>
          {/* ── Election header ──────────────────────────────────────────── */}
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold" style={{ color: BRAND }}>
                  {election.title}
                </h1>
                <p className="mt-0.5 text-sm text-gray-500">{election.organization?.name ?? "—"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {(election.status === "open" || election.status === "paused" || election.status === "closed") && (
                  <button
                    onClick={() => navigate(`/admin/elecciones/resultados?id=${electionId}`)}
                    className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition hover:opacity-80"
                    style={{ borderColor: BRAND, color: BRAND }}
                  >
                    <BarChart2 size={13} />
                    Ver resultados
                  </button>
                )}
                <span
                  className="rounded-full px-4 py-1.5 text-sm font-semibold"
                  style={{ backgroundColor: status!.bg, color: status!.color }}
                >
                  {status!.label}
                </span>
              </div>
            </div>

            {/* Date row */}
            <div className="mt-4 flex flex-wrap gap-5 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-gray-400" />
                {election.start_at ? fmtDate(election.start_at) : "Sin fecha de inicio"}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-gray-400" />
                {election.start_at
                  ? `${fmtTime(election.start_at)} – ${fmtTime(election.end_at)}`
                  : "Sin horario definido"}
              </span>
            </div>

            {/* ── Validation hint for draft ────────────────────────────── */}
            {election.status === "draft" && (assocCount === 0 || voterCount === 0) && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">Completa antes de programar o activar:</p>
                  <ul className="mt-1 list-disc pl-4 text-xs space-y-0.5">
                    {assocCount === 0 && <li>Agrega al menos una planilla con candidatos</li>}
                    {voterCount === 0 && <li>Importa o agrega al menos un votante</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* ── State transitions ────────────────────────────────────── */}
            {nextTransitions.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                <span className="text-xs font-medium text-gray-400">Cambiar estado:</span>
                {transitioning ? (
                  <Loader2 size={15} className="animate-spin text-gray-400" />
                ) : (
                  nextTransitions.map(({ value, label, color, Icon }) => (
                    <button
                      key={value}
                      onClick={() => handleTransition(value, label)}
                      className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-80"
                      style={{ backgroundColor: color }}
                    >
                      <Icon size={13} />
                      {label}
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Error from transition (includes backend validation messages) */}
            {transitionError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{transitionError}</span>
              </div>
            )}

            {/* ── Posponer (only for scheduled) ────────────────────────── */}
            {election.status === "scheduled" && !postponeMode && (
              <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-4">
                <button
                  onClick={() => { setPostponeMode(true); setPostponeError(null) }}
                  className="text-xs font-semibold underline text-gray-400 transition hover:text-gray-600"
                >
                  Posponer fecha programada
                </button>
              </div>
            )}

            {postponeMode && (
              <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Nueva fecha y hora de inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={newStartAt}
                    onChange={(e) => setNewStartAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <button
                  onClick={handlePostpone}
                  disabled={!newStartAt || postponing}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#1D4ED8" }}
                >
                  {postponing ? "Guardando…" : "Confirmar"}
                </button>
                <button
                  onClick={() => { setPostponeMode(false); setPostponeError(null) }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancelar
                </button>
                {postponeError && (
                  <p className="w-full text-xs text-red-500">{postponeError}</p>
                )}
              </div>
            )}
          </div>

          {/* ── Status banners ──────────────────────────────────────────── */}
          {election.status === "open" && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <PauseCircle size={15} className="shrink-0 text-amber-500" />
              Esta elección está <strong className="mx-1">activa</strong> — paúsala para poder editar su contenido.
            </div>
          )}
          {election.status === "closed" && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Lock size={15} className="shrink-0 text-slate-400" />
              Esta elección está <strong className="mx-1">finalizada</strong> — el contenido es de solo lectura y no puede modificarse.
            </div>
          )}
          {election.status === "cancelled" && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Lock size={15} className="shrink-0 text-slate-400" />
              Esta elección está <strong className="mx-1">archivada</strong> — el contenido es de solo lectura. Puedes restaurarla a borrador con el botón de arriba.
            </div>
          )}

          {/* ── Section cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <SectionCard
              icon={<FileText size={17} style={{ color: BRAND }} />}
              title="Detalles Generales"
              onEdit={() => goToStep(1)}
              editLabel={canEdit ? "Editar" : "Ver"}
            >
              <InfoRow label="Nombre" value={election.title} />
              <InfoRow label="Campus" value={election.organization?.name ?? "—"} />
              <InfoRow label="Inicio" value={`${fmtDate(election.start_at)}, ${fmtTime(election.start_at)}`} />
              <InfoRow label="Cierre" value={`${fmtDate(election.end_at)}, ${fmtTime(election.end_at)}`} />
              {election.description && (
                <p className="mt-3 text-xs text-gray-400 leading-relaxed">{election.description}</p>
              )}
            </SectionCard>

            <SectionCard
              icon={<Vote size={17} style={{ color: BRAND }} />}
              title="Planillas y Candidatos"
              badge={assocCount === 0 ? "⚠ Sin planillas" : undefined}
              onEdit={() => goToStep(2)}
              editLabel={canEdit ? "Editar" : "Ver"}
            >
              <div className="flex justify-around py-3">
                <StatBox value={assocCount} label="Planillas" />
                <div className="w-px bg-gray-100" />
                <StatBox value={candidateCount} label="Candidatos" />
              </div>
            </SectionCard>

            <SectionCard
              icon={<Users size={17} style={{ color: BRAND }} />}
              title="Padrón de Votantes"
              badge={voterCount === 0 ? "⚠ Sin votantes" : undefined}
              onEdit={() => goToStep(4)}
              editLabel={canEdit ? "Editar" : "Ver"}
            >
              <div className="flex justify-center py-3">
                <StatBox value={voterCount} label="Votantes registrados" />
              </div>
            </SectionCard>

            <SectionCard
              icon={<Eye size={17} style={{ color: BRAND }} />}
              title="Revisión y Simulación"
              onEdit={() => goToStep(5)}
              editLabel="Abrir"
            >
              <p className="py-3 text-sm text-gray-500 leading-relaxed">
                Verifica el resumen completo y simula la experiencia de votación
                antes de activar la elección.
              </p>
            </SectionCard>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
