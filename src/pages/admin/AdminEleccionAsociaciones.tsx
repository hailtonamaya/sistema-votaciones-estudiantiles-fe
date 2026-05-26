import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiAssociation,
  type ApiCareer,
  type ApiElection,
  createAssociation,
  deleteAssociation,
  listAssociations,
  listCareers,
  listElections,
} from "@/services/admin.service"
import {
  AlertCircle,
  Download,
  Filter,
  ImageIcon,
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

export default function AdminEleccionAsociaciones() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [elections, setElections] = useState<ApiElection[]>([])
  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [associations, setAssociations] = useState<ApiAssociation[]>([])
  const [loadingElections, setLoadingElections] = useState(true)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<"grid" | "list">("list")
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const selectedId = searchParams.get("election_id") ?? ""

  const [form, setForm] = useState({ career_id: "", name: "", description: "", logo_url: "" })

  useEffect(() => {
    Promise.all([listElections(token!), listCareers(token!)])
      .then(([el, ca]) => { setElections(el); setCareers(ca) })
      .catch(() => {})
      .finally(() => setLoadingElections(false))
  }, [token])

  useEffect(() => {
    if (!selectedId) { setAssociations([]); return }
    setLoading(true)
    listAssociations(token!, { election_id: selectedId })
      .then(setAssociations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedId, token])

  function selectElection(id: string) {
    setSearchParams(id ? { election_id: id } : {}, { replace: true })
    setShowForm(false)
    setError(null)
  }

  async function handleCreate() {
    setError(null)
    if (!form.career_id) { setError("Selecciona una carrera"); return }
    if (!form.name.trim()) { setError("El nombre es requerido"); return }
    setSaving(true)
    try {
      const created = await createAssociation(token!, {
        election_id: selectedId,
        career_id: form.career_id,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        logo_url: form.logo_url.trim() || undefined,
      })
      setAssociations((prev) => [...prev, created])
      setForm({ career_id: "", name: "", description: "", logo_url: "" })
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear asociación")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAssociation(token!, id)
      setAssociations((prev) => prev.filter((a) => a.association_id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  const filtered = associations.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AdminLayout>
      <h1 className="mb-6 text-xl font-bold" style={{ color: BRAND }}>
        Elecciones &gt; Asociaciones
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
            Elige una elección en el selector de arriba para ver y gestionar sus asociaciones.
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
              Agregar Asociación
            </button>
          </div>

          {/* Add form */}
          {showForm && (
            <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: BRAND }}>Agregar Asociación</h3>
                <button onClick={() => setShowForm(false)}>
                  <X size={18} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              {error && <ErrorBanner message={error} />}

              {/* Image upload */}
              <div className="mb-4">
                <p className="mb-1.5 text-sm font-semibold" style={{ color: BRAND }}>Portada de la Asociación</p>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 transition hover:border-blue-400"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <ImageIcon size={22} className="text-blue-400" />
                  </div>
                  <p className="text-sm text-gray-500">Arrastra una imagen o haz click para subir</p>
                  <p className="text-xs text-gray-400">PNG, JPG hasta 5MB</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (ev) => setForm((p) => ({ ...p, logo_url: ev.target?.result as string }))
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </div>
                {form.logo_url && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={form.logo_url} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-gray-200" />
                    <button onClick={() => setForm((p) => ({ ...p, logo_url: "" }))} className="text-xs text-red-500 hover:underline">
                      Quitar imagen
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                    Nombre de la Asociación <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Ej. Asociación de Ingeniería"
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>Descripción</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    rows={2}
                    placeholder="Descripción de la asociación…"
                    className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  />
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
              <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>Aún no hay asociaciones creadas</p>
              <p className="mb-6 max-w-sm text-sm text-gray-500">
                Agrega las asociaciones que participarán en esta elección para configurar su papeleta.
              </p>
              <button
                onClick={() => { setShowForm(true); setError(null) }}
                className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                <Plus size={15} />
                Agregar Asociación
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
              {filtered.map((assoc) => {
                const careerName = assoc.election_career?.career?.name
                return (
                  <div key={assoc.association_id} className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50">
                    {assoc.logo_url ? (
                      <img src={assoc.logo_url} alt={assoc.name} className="h-14 w-14 flex-shrink-0 rounded-lg object-cover border border-gray-100" />
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Users size={24} style={{ color: ACCENT }} />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-sm" style={{ color: BRAND }}>{assoc.name}</p>
                      {careerName && <p className="text-xs text-gray-400 mt-0.5">{careerName}</p>}
                      <p className="text-xs text-gray-500 mt-0.5">
                        {assoc.association_member?.length ?? 0} candidato(s)
                      </p>
                    </div>
                    <button onClick={() => handleDelete(assoc.association_id)} className="text-red-400 hover:text-red-600 transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
