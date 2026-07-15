import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiElection,
  type ApiOrganization,
  type ElectionStatus,
  listElections,
  listOrganizations,
  deleteElection,
  transitionElection,
} from "@/services/admin.service"
import {
  Archive,
  BarChart2,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"

const STATUS_CONFIG: Record<ElectionStatus, { label: string; bg: string; color: string }> = {
  open:      { label: "Activa",      bg: "#DCFCE7", color: "#16A34A" },
  paused:    { label: "Pausada",     bg: "#FEE2E2", color: "#DC2626" },
  closed:    { label: "Finalizada",  bg: "#E2E8F0", color: "#475569" },
  draft:     { label: "Borrador",    bg: "#FEF9C3", color: "#A16207" },
  scheduled: { label: "Programada",  bg: "#DBEAFE", color: "#1D4ED8" },
  cancelled: { label: "Archivada",   bg: "#F1F5F9", color: "#94A3B8" },
}


function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-HN", { day: "numeric", month: "short", year: "numeric" })
}

function formatTime(start: string | null, end: string | null): string {
  if (!start && !end) return "—"
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-HN", { hour: "numeric", minute: "2-digit", hour12: true })
  if (start && end) return `${fmt(start)} - ${fmt(end)}`
  if (start) return `Desde ${fmt(start)}`
  return `Hasta ${fmt(end!)}`
}

export default function AdminEleccionesDetalles() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [elections, setElections] = useState<ApiElection[]>([])
  const [organizations, setOrganizations] = useState<ApiOrganization[]>([])
  const [selectedOrg, setSelectedOrg] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")

  async function loadElections() {
    try {
      setLoading(true)
      setError(null)
      const data = await listElections(token!)
      setElections(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar elecciones")
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { loadElections() }, [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { listOrganizations(token!).then(setOrganizations).catch(() => {}) }, [])

  async function handleDelete(id: string) {
    try {
      await deleteElection(token!, id)
      setElections((prev) => prev.filter((e) => e.election_id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  async function handleArchive(election: ApiElection) {
    if (election.status === "cancelled") return
    if (!confirm(`¿Archivar "${election.title}"? Pasará a la sección Archivados.`)) return
    try {
      await transitionElection(token!, election.election_id, "cancelled")
      setElections((prev) => prev.filter((e) => e.election_id !== election.election_id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al archivar")
    }
  }

  const filtered = elections.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase())
    const matchOrg = !selectedOrg || e.organization_id === selectedOrg
    return matchSearch && matchOrg
  })

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#06065C" }}>
          Elecciones
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Administra, edita y supervisa los procesos electorales.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <Search size={15} className="flex-shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-44 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        <select
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-600 shadow-sm outline-none focus:border-blue-400"
        >
          <option value="">Todos los campus</option>
          {organizations.map((o) => (
            <option key={o.organization_id} value={o.organization_id}>{o.name}</option>
          ))}
        </select>

        <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => setView("grid")}
            className="flex items-center px-3 py-2 transition"
            style={{ backgroundColor: view === "grid" ? "#06065C" : "transparent", color: view === "grid" ? "#ffffff" : "#9CA3AF" }}
            title="Vista cuadrícula"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className="flex items-center px-3 py-2 transition"
            style={{ backgroundColor: view === "list" ? "#06065C" : "transparent", color: view === "list" ? "#ffffff" : "#9CA3AF" }}
            title="Vista lista"
          >
            <List size={16} />
          </button>
        </div>

        <button
          onClick={() => navigate("/admin/elecciones/wizard?step=1")}
          className="ml-auto flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: "#06065C" }}
        >
          <Plus size={15} />
          Nueva Elección
        </button>
      </div>

      {/* States */}
      {loading && (
        <div className="flex justify-center py-24">
          <span className="text-sm text-gray-400">Cargando elecciones…</span>
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <p className="text-sm">No se encontraron elecciones.</p>
        </div>
      )}

      {/* Cards */}
      {!loading && !error && filtered.length > 0 && (
        <div
          className={`grid gap-6 ${
            view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
          }`}
        >
          {filtered.map((election) => {
            const status = STATUS_CONFIG[election.status]
            return (
              <div key={election.election_id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
                {/* Card body */}
                <div className="flex flex-col gap-3 p-5 pb-4">
                  <h3 className="font-bold text-base leading-snug" style={{ color: "#06065C" }}>
                    {election.title}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 size={15} className="flex-shrink-0 text-gray-400" />
                    <span>{election.organization?.name ?? "—"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={15} className="flex-shrink-0 text-gray-400" />
                    <span>{formatDate(election.start_at)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={15} className="flex-shrink-0 text-gray-400" />
                    <span>{formatTime(election.start_at, election.end_at)}</span>
                  </div>
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-3 border-t border-gray-100 px-5 py-3">
                  {(election.status === "closed" || election.status === "cancelled") ? (
                    <button
                      title="Ver (solo lectura)"
                      onClick={() => navigate(`/admin/elecciones/editar?id=${election.election_id}`)}
                      className="transition hover:opacity-60"
                    >
                      <Eye size={17} style={{ color: "#94A3B8" }} />
                    </button>
                  ) : (
                    <button
                      title="Editar"
                      onClick={() => navigate(`/admin/elecciones/editar?id=${election.election_id}`)}
                      className="transition hover:opacity-60"
                    >
                      <Pencil size={17} style={{ color: "#03AED2" }} />
                    </button>
                  )}
                  {(election.status === "open" || election.status === "paused" || election.status === "closed") && (
                    <button
                      title="Ver resultados"
                      onClick={() => navigate(`/admin/elecciones/resultados?id=${election.election_id}`)}
                      className="transition hover:opacity-60"
                    >
                      <BarChart2 size={17} style={{ color: "#03AED2" }} />
                    </button>
                  )}
                  {election.status !== "closed" && (
                    <button
                      title="Archivar"
                      onClick={() => handleArchive(election)}
                      className="transition hover:opacity-60"
                    >
                      <Archive size={17} style={{ color: "#03AED2" }} />
                    </button>
                  )}
                  {election.status === "draft" && (
                    <button
                      title="Eliminar"
                      onClick={() => handleDelete(election.election_id)}
                      className="transition hover:opacity-60"
                    >
                      <Trash2 size={17} style={{ color: "#EF4444" }} />
                    </button>
                  )}

                  <div
                    className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ backgroundColor: status.bg, color: status.color }}
                  >
                    <CheckCircle2 size={12} />
                    {status.label}
                  </div>
                </div>


                {/* Bottom accent */}
                <div className="h-1.5" style={{ backgroundColor: "#47C8F0" }} />
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
