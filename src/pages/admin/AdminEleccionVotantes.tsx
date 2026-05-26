import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiCareer,
  type ApiElection,
  type ApiVoter,
  createVoter,
  deleteVoter,
  listCareers,
  listElections,
  listVoters,
} from "@/services/admin.service"
import {
  AlertCircle,
  Download,
  Filter,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react"

const BRAND = "#06065C"
const ACCENT = "#03AED2"

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      <AlertCircle size={16} className="flex-shrink-0" />
      {message}
    </div>
  )
}

export default function AdminEleccionVotantes() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [elections, setElections] = useState<ApiElection[]>([])
  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [voters, setVoters] = useState<ApiVoter[]>([])
  const [loadingElections, setLoadingElections] = useState(true)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<"grid" | "list">("list")
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: "", institutional_id: "", email: "", career_id: "" })

  const selectedId = searchParams.get("election_id") ?? ""

  useEffect(() => {
    Promise.all([listElections(token!), listCareers(token!)])
      .then(([el, ca]) => { setElections(el); setCareers(ca) })
      .catch(() => {})
      .finally(() => setLoadingElections(false))
  }, [token])

  useEffect(() => {
    if (!selectedId) { setVoters([]); return }
    setLoading(true)
    listVoters(token!, selectedId)
      .then(setVoters)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedId, token])

  function selectElection(id: string) {
    setSearchParams(id ? { election_id: id } : {}, { replace: true })
    setShowForm(false)
    setError(null)
  }

  function getVoterName(v: ApiVoter) { return v.full_name ?? v.student?.user?.full_name ?? "—" }
  function getVoterEmail(v: ApiVoter) { return v.email ?? v.student?.user?.email ?? "—" }
  function getVoterAccount(v: ApiVoter) { return v.institutional_id ?? v.student?.institutional_id ?? "—" }
  function getVoterCareer(v: ApiVoter) { return v.career?.name ?? "—" }

  async function handleCreate() {
    setError(null)
    if (!form.full_name.trim()) { setError("El nombre es requerido"); return }
    if (!form.institutional_id.trim()) { setError("El número de cuenta es requerido"); return }
    if (!form.email.trim()) { setError("El correo institucional es requerido"); return }
    if (!form.career_id) { setError("Selecciona una carrera"); return }
    setSaving(true)
    try {
      const created = await createVoter(token!, {
        election_id: selectedId,
        career_id: form.career_id,
        full_name: form.full_name.trim(),
        institutional_id: form.institutional_id.trim(),
        email: form.email.trim(),
      })
      setVoters((prev) => [...prev, created])
      setForm({ full_name: "", institutional_id: "", email: "", career_id: "" })
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al agregar votante")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteVoter(token!, id)
      setVoters((prev) => prev.filter((v) => v.election_voter_id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  const filtered = voters.filter((v) =>
    getVoterName(v).toLowerCase().includes(search.toLowerCase()) ||
    getVoterEmail(v).toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AdminLayout>
      <h1 className="mb-6 text-xl font-bold" style={{ color: BRAND }}>
        Elecciones &gt; Votantes
      </h1>

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
                <option key={e.election_id} value={e.election_id}>
                  {e.title}
                </option>
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
          <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>
            Selecciona una elección
          </p>
          <p className="max-w-sm text-sm text-gray-500">
            Elige una elección en el selector de arriba para ver y gestionar sus votantes.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {/* Toolbar */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
              <Search size={15} className="text-gray-400" />
              <input
                type="text"
                placeholder="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-40 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
            </div>
            <button className="flex items-center justify-center rounded-lg px-3 py-2.5 text-white shadow-sm" style={{ backgroundColor: BRAND }}>
              <Filter size={15} />
            </button>
            <button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm" style={{ backgroundColor: BRAND }}>
              Buscar
            </button>
            <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {(["grid", "list"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="flex items-center px-3 py-2 transition"
                  style={{ backgroundColor: view === v ? BRAND : "transparent", color: view === v ? "#fff" : "#9CA3AF" }}
                >
                  {v === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1 rounded-lg px-3 py-2.5 text-white shadow-sm" style={{ backgroundColor: BRAND }}>
              <Download size={15} />
            </button>
            <button
              onClick={() => { setShowForm(true); setError(null) }}
              className="ml-auto flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: BRAND }}
            >
              <Plus size={15} />
              Agregar Votante
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: BRAND }}>Agregar Votante</h3>
                <button onClick={() => setShowForm(false)}>
                  <X size={18} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              {error && <ErrorBanner message={error} />}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                    Nombre del Estudiante <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                    placeholder="Nombre completo"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                    Número de Cuenta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.institutional_id}
                    onChange={(e) => setForm((p) => ({ ...p, institutional_id: e.target.value }))}
                    placeholder="Ej. 20211001234"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                    Correo Institucional <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="estudiante@unitec.edu.hn"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                    Carrera <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.career_id}
                    onChange={(e) => setForm((p) => ({ ...p, career_id: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  >
                    <option value="">Selecciona una carrera</option>
                    {careers.map((c) => (
                      <option key={c.career_id} value={c.career_id}>{c.name} ({c.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: BRAND }}
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  <Save size={15} />
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <Users size={30} style={{ color: ACCENT }} />
              </div>
              <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>Aún no hay votantes registrados</p>
              <p className="mb-6 max-w-sm text-sm text-gray-500">
                Registra los estudiantes habilitados para participar en esta elección.
              </p>
              <button
                onClick={() => { setShowForm(true); setError(null) }}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                <Plus size={15} />
                Agregar Votante
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-100">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: "#DBEAFE" }}>
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: BRAND }}>Nombre</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: BRAND }}>N° Cuenta</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: BRAND }}>Correo</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: BRAND }}>Carrera</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: BRAND }}>Votó</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {filtered.map((v) => (
                    <tr key={v.election_voter_id} className="transition hover:bg-gray-50">
                      <td className="px-5 py-3 font-medium text-gray-800">{getVoterName(v)}</td>
                      <td className="px-5 py-3 text-gray-500">{getVoterAccount(v)}</td>
                      <td className="px-5 py-3 text-gray-500">{getVoterEmail(v)}</td>
                      <td className="px-5 py-3 text-gray-500">{getVoterCareer(v)}</td>
                      <td className="px-5 py-3">
                        {v.has_voted
                          ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600">Sí</span>
                          : <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">No</span>}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => handleDelete(v.election_voter_id)} className="text-red-400 hover:text-red-600 transition">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
