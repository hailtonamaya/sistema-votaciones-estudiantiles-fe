import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiCareer,
  type ApiElection,
  listAssociations,
  listCareers,
  listElections,
  listVoters,
  transitionElection,
} from "@/services/admin.service"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Users,
  XCircle,
} from "lucide-react"

const BRAND = "#06065C"
const ACCENT = "#03AED2"

type RevisionStatus = "ok" | "warning" | "incomplete"

function StatusBadge({ status }: { status: RevisionStatus }) {
  const cfg = {
    ok:         { bg: "#DCFCE7", color: "#16A34A", icon: <CheckCircle2 size={14} />, label: "Completo" },
    warning:    { bg: "#FEF9C3", color: "#A16207", icon: <AlertCircle size={14} />,  label: "Revisar" },
    incomplete: { bg: "#FEE2E2", color: "#DC2626", icon: <XCircle size={14} />,      label: "Incompleto" },
  }[status]
  return (
    <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.icon}
      {cfg.label}
    </div>
  )
}

export default function AdminEleccionRevision() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [elections, setElections] = useState<ApiElection[]>([])
  const [loadingElections, setLoadingElections] = useState(true)

  const [election, setElection] = useState<ApiElection | null>(null)
  const [assocCount, setAssocCount] = useState(0)
  const [voterCount, setVoterCount] = useState(0)
  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [simulateCareer, setSimulateCareer] = useState("")
  const [loading, setLoading] = useState(false)
  const [activating, setActivating] = useState(false)

  const selectedId = searchParams.get("election_id") ?? ""

  useEffect(() => {
    listElections(token!)
      .then(setElections)
      .catch(() => {})
      .finally(() => setLoadingElections(false))
  }, [token])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedId) {
      setElection(null)
      setAssocCount(0)
      setVoterCount(0)
      setCareers([])
      return
    }
    setLoading(true)
    Promise.all([
      listElections(token!).then((list) => list.find((e) => e.election_id === selectedId) ?? null),
      listAssociations(token!, { election_id: selectedId }),
      listVoters(token!, selectedId),
      listCareers(token!),
    ]).then(([el, assocs, voters, c]) => {
      setElection(el)
      setAssocCount(assocs.length)
      setVoterCount(voters.length)
      setCareers(c)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [selectedId, token])
  /* eslint-enable react-hooks/set-state-in-effect */

  function selectElection(id: string) {
    setSearchParams(id ? { election_id: id } : {}, { replace: true })
    setSimulateCareer("")
  }

  async function handleActivate() {
    if (!election) return
    const nextStatus = election.status === "draft" ? "scheduled" : "open"
    setActivating(true)
    try {
      await transitionElection(token!, selectedId, nextStatus)
      navigate("/admin/elecciones/detalles")
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al activar")
    } finally {
      setActivating(false)
    }
  }

  const electionOk: RevisionStatus = election?.title && election.organization_id ? "ok" : "incomplete"
  const assocStatus: RevisionStatus = assocCount >= 2 ? "ok" : assocCount === 1 ? "warning" : "incomplete"
  const voterStatus: RevisionStatus = voterCount >= 1 ? "ok" : "incomplete"
  const simStatus: RevisionStatus = simulateCareer ? "ok" : "incomplete"

  const rows = [
    {
      label: "Detalles generales",
      detail: "Nombre, Fecha, Hora y más…",
      status: electionOk,
      onVerify: () => navigate(`/admin/elecciones/wizard?id=${selectedId}&step=1`),
    },
    {
      label: "Cantidad de asociaciones",
      detail: assocCount,
      status: assocStatus,
      onVerify: () => navigate(`/admin/elecciones/asociaciones?election_id=${selectedId}`),
    },
    {
      label: "Cantidad de votantes",
      detail: voterCount,
      status: voterStatus,
      onVerify: () => navigate(`/admin/elecciones/votantes?election_id=${selectedId}`),
    },
  ]

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Revisión</h1>
        <p className="mt-0.5 text-sm text-gray-500">Antes de iniciar la votación debes completar las siguientes tareas.</p>
      </div>

      {/* Election selector */}
      <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        {loadingElections ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={15} className="animate-spin" /> Cargando elecciones…
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold whitespace-nowrap" style={{ color: BRAND }}>
              Elección:
            </label>
            <select
              value={selectedId}
              onChange={(e) => selectElection(e.target.value)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
            >
              <option value="">Selecciona una elección</option>
              {elections.map((e) => (
                <option key={e.election_id} value={e.election_id}>{e.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!selectedId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 px-8 shadow-sm text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Users size={30} style={{ color: ACCENT }} />
          </div>
          <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>Selecciona una elección</p>
          <p className="max-w-sm text-sm text-gray-500">
            Elige una elección en el selector de arriba para revisar su estado antes de activarla.
          </p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="w-full rounded-2xl bg-white p-5 shadow-sm space-y-8 sm:p-8">
          {/* Summary */}
          <div>
            <h2 className="mb-4 text-lg font-bold" style={{ color: BRAND }}>Resumen de Elección</h2>
            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.label} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <p className="flex-1 text-sm text-gray-700">{row.label}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{row.detail}</span>
                    <button
                      onClick={row.onVerify}
                      className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: BRAND }}
                    >
                      Verificar
                    </button>
                    <StatusBadge status={row.status as RevisionStatus} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Simulate voting */}
          <div>
            <h2 className="mb-4 text-lg font-bold" style={{ color: BRAND }}>Probar experiencia de votación</h2>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={simulateCareer}
                onChange={(e) => setSimulateCareer(e.target.value)}
                className="flex-1 min-w-[200px] rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="">Selecciona una carrera para simular</option>
                {careers.map((c) => (
                  <option key={c.career_id} value={c.career_id}>{c.name} ({c.code})</option>
                ))}
              </select>
              <button
                disabled={!simulateCareer}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: BRAND }}
              >
                Simular
              </button>
              <StatusBadge status={simStatus} />
            </div>
          </div>

          {/* Election status + activate button */}
          {election && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-5 py-4">
              <p className="text-sm text-gray-600">
                Estado actual:{" "}
                <span className="font-semibold" style={{ color: BRAND }}>
                  {election.status === "draft" ? "Borrador"
                    : election.status === "scheduled" ? "Programada"
                    : election.status === "open" ? "Activa"
                    : election.status}
                </span>
              </p>
              {election.status !== "open" && election.status !== "closed" && election.status !== "cancelled" && (
                <button
                  onClick={handleActivate}
                  disabled={activating}
                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: BRAND }}
                >
                  {activating && <Loader2 size={15} className="animate-spin" />}
                  {election.status === "draft" ? "Programar Elección" : "Iniciar Elección"}
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
