import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiElection,
  listElections,
  transitionElection,
  deleteElection,
} from "@/services/admin.service"
import { BRAND, ACCENT } from "@/lib/brand"
import {
  Archive,
  BarChart2,
  Building2,
  Calendar,
  Clock,
  LayoutGrid,
  List,
  Loader2,
  Search,
  Trash2,
  Undo2,
} from "lucide-react"

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-HN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatTime(start: string | null, end: string | null): string {
  if (!start && !end) return "—"
  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-HN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
  if (start && end) return `${fmt(start)} — ${fmt(end)}`
  if (start) return `Desde ${fmt(start)}`
  return `Hasta ${fmt(end!)}`
}

export default function AdminArchivados() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [elections, setElections] = useState<ApiElection[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("grid")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadElections() }, [])

  async function loadElections() {
    try {
      setLoading(true)
      setError(null)
      const data = await listElections(token!, "cancelled")
      setElections(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar los archivados")
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore(election: ApiElection) {
    if (!confirm(`¿Restaurar "${election.title}" como borrador?`)) return
    setActionLoading(election.election_id)
    try {
      await transitionElection(token!, election.election_id, "draft")
      setElections((prev) => prev.filter((e) => e.election_id !== election.election_id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al restaurar la elección")
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(election: ApiElection) {
    if (
      !confirm(
        `¿Eliminar permanentemente "${election.title}"? Esta acción no se puede deshacer.`,
      )
    )
      return
    setActionLoading(election.election_id)
    try {
      await deleteElection(token!, election.election_id)
      setElections((prev) => prev.filter((e) => e.election_id !== election.election_id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar la elección")
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = elections.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.organization?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>
          Archivados
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Elecciones archivadas. Puedes ver sus resultados, restaurarlas como borrador o
          eliminarlas permanentemente.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <Search size={15} className="flex-shrink-0 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o campus…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52 bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </div>

        <button
          onClick={loadElections}
          className="rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          Actualizar
        </button>

        <div className="ml-auto flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => setView("grid")}
            className="flex items-center px-3 py-2 transition"
            style={{
              backgroundColor: view === "grid" ? BRAND : "transparent",
              color: view === "grid" ? "#ffffff" : "#9CA3AF",
            }}
            title="Vista cuadrícula"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className="flex items-center px-3 py-2 transition"
            style={{
              backgroundColor: view === "list" ? BRAND : "transparent",
              color: view === "list" ? "#ffffff" : "#9CA3AF",
            }}
            title="Vista lista"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex h-64 items-center justify-center">
          <Loader2 size={28} className="animate-spin text-gray-400" />
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-24 shadow-sm">
          <Archive size={36} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-400">
            {search ? "No se encontraron resultados para tu búsqueda." : "No hay elecciones archivadas."}
          </p>
          {!search && (
            <p className="mt-1 text-xs text-gray-300">
              Las elecciones que archives aparecerán aquí.
            </p>
          )}
        </div>
      )}

      {/* Cards / List */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="mb-4 text-xs text-gray-400">
            {filtered.length} elección{filtered.length !== 1 ? "es" : ""} archivada
            {filtered.length !== 1 ? "s" : ""}
          </p>
          <div
            className={`grid gap-5 ${
              view === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {filtered.map((election) => {
              const busy = actionLoading === election.election_id
              return (
                <div
                  key={election.election_id}
                  className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm"
                >
                  {/* Card body */}
                  <div className="flex flex-col gap-3 p-5 pb-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="text-base font-bold leading-snug"
                        style={{ color: BRAND }}
                      >
                        {election.title}
                      </h3>
                      <span className="mt-0.5 flex-shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
                        Archivada
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Building2 size={14} className="flex-shrink-0 text-gray-400" />
                      <span>{election.organization?.name ?? "—"}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar size={14} className="flex-shrink-0 text-gray-400" />
                      <span>{formatDate(election.start_at)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} className="flex-shrink-0 text-gray-400" />
                      <span>{formatTime(election.start_at, election.end_at)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-5 py-3">
                    <button
                      title="Ver resultados"
                      disabled={busy}
                      onClick={() =>
                        navigate(
                          `/admin/elecciones/resultados?id=${election.election_id}`,
                        )
                      }
                      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: ACCENT }}
                    >
                      <BarChart2 size={13} />
                      Resultados
                    </button>

                    <button
                      title="Restaurar como borrador"
                      disabled={busy}
                      onClick={() => handleRestore(election)}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Undo2 size={13} />
                      )}
                      Restaurar
                    </button>

                    <button
                      title="Eliminar permanentemente"
                      disabled={busy}
                      onClick={() => handleDelete(election)}
                      className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                      Eliminar
                    </button>
                  </div>

                  <div className="h-1.5 bg-slate-200" />
                </div>
              )
            })}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
