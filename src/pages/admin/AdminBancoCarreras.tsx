import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiCareer,
  type ApiOrganization,
  listCareers,
  createCareer,
  updateCareer,
  deleteCareer,
  listOrganizations,
} from "@/services/admin.service"
import { Pencil, Plus, Search, Trash2, X } from "lucide-react"

interface Carrera {
  id: string
  nombre: string
  codigo: string
  organizationId: string
  campusNombre: string
  minVotos: number
}

interface FormState {
  nombre: string
  codigo: string
  organizationId: string
  minVotos: string
}

const EMPTY_FORM: FormState = { nombre: "", codigo: "", organizationId: "", minVotos: "10" }

function fromApi(c: ApiCareer, orgs: ApiOrganization[]): Carrera {
  const org = orgs.find((o) => o.organization_id === c.organization_id)
  return {
    id: c.career_id,
    nombre: c.name,
    codigo: c.code,
    organizationId: c.organization_id,
    campusNombre: c.organization?.name ?? org?.name ?? "—",
    minVotos: c.min_votes_required,
  }
}

export default function AdminBancoCarreras() {
  const { token } = useAuth()
  const [carreras, setCarreras] = useState<Carrera[]>([])
  const [organizations, setOrganizations] = useState<ApiOrganization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filterCampus, setFilterCampus] = useState("")

  const isFormValid = !!(form.nombre.trim() && form.codigo.trim() && form.organizationId && Number(form.minVotos) > 0)

  const filtered = carreras.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.nombre.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q)
    const matchCampus = !filterCampus || c.organizationId === filterCampus
    return matchSearch && matchCampus
  })

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const [careers, orgs] = await Promise.all([listCareers(token!), listOrganizations(token!)])
      setCarreras(careers.map((c) => fromApi(c, orgs)))
      setOrganizations(orgs)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { loadData() }, [])

  function openAdd() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setModalError(null)
    setModalOpen(true)
  }

  function openEdit(carrera: Carrera) {
    setEditingId(carrera.id)
    setForm({
      nombre: carrera.nombre,
      codigo: carrera.codigo,
      organizationId: carrera.organizationId,
      minVotos: String(carrera.minVotos),
    })
    setModalError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setForm(EMPTY_FORM)
    setModalError(null)
  }

  async function handleSave() {
    if (!isFormValid) return
    try {
      setSaving(true)
      setModalError(null)
      const body = {
        name: form.nombre,
        code: form.codigo,
        organization_id: form.organizationId,
        min_votes_required: Number(form.minVotos),
      }
      if (editingId !== null) {
        const updated = await updateCareer(token!, editingId, body)
        setCarreras((prev) => prev.map((c) => (c.id === editingId ? fromApi(updated, organizations) : c)))
      } else {
        const created = await createCareer(token!, body)
        setCarreras((prev) => [...prev, fromApi(created, organizations)])
      }
      closeModal()
    } catch (e) {
      setModalError(e instanceof Error ? e.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCareer(token!, id)
      setCarreras((prev) => prev.filter((c) => c.id !== id))
      setSelected((prev) => prev.filter((s) => s !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  function toggleAll() {
    const ids = filtered.map((c) => c.id)
    const allChecked = ids.every((id) => selected.includes(id))
    setSelected((prev) =>
      allChecked ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]
    )
  }

  const allSelected = filtered.length > 0 && filtered.every((c) => selected.includes(c.id))

  return (
    <AdminLayout>
      <h1 className="mb-6 text-xl font-bold" style={{ color: "#06065C" }}>
        Configuración &gt; Banco de Carreras
      </h1>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <Search size={14} className="flex-shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={filterCampus}
            onChange={(e) => setFilterCampus(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 outline-none"
          >
            <option value="">Todos los campus</option>
            {organizations.map((o) => (
              <option key={o.organization_id} value={o.organization_id}>{o.name}</option>
            ))}
          </select>

          {(search || filterCampus) && (
            <button
              onClick={() => { setSearch(""); setFilterCampus("") }}
              className="text-xs text-gray-400 underline hover:text-gray-600"
            >
              Limpiar filtros
            </button>
          )}

          <span className="text-xs text-gray-400">
            {filtered.length} de {carreras.length} carrera{carreras.length !== 1 ? "s" : ""}
          </span>

          <div className="ml-auto">
            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "#06065C" }}
            >
              <Plus size={16} />
              Agregar Carrera
            </button>
          </div>
        </div>

        {loading && (
          <p className="py-12 text-center text-sm text-gray-400">Cargando…</p>
        )}

        {!loading && error && (
          <p className="py-8 text-center text-sm text-red-500">{error}</p>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "#DBEAFE" }}>
                  <th className="w-10 px-4 py-3 text-left">
                    <button
                      onClick={toggleAll}
                      className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition"
                      style={{ borderColor: allSelected ? "#06065C" : "#94A3B8", backgroundColor: allSelected ? "#06065C" : "transparent" }}
                    >
                      {allSelected && <span className="block h-2 w-2 rounded-full bg-white" />}
                    </button>
                  </th>
                  {["Nombre", "Código", "Campus", "Mín. Votos", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "#06065C" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((carrera) => {
                  const isSelected = selected.includes(carrera.id)
                  return (
                    <tr key={carrera.id} className="border-t border-gray-100 transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(carrera.id)}
                          className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition"
                          style={{ borderColor: isSelected ? "#06065C" : "#CBD5E1", backgroundColor: isSelected ? "#06065C" : "transparent" }}
                        >
                          {isSelected && <span className="block h-2 w-2 rounded-full bg-white" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{carrera.nombre}</td>
                      <td className="px-4 py-3 text-gray-500">{carrera.codigo}</td>
                      <td className="px-4 py-3 text-gray-500">{carrera.campusNombre}</td>
                      <td className="px-4 py-3 text-center text-gray-500">{carrera.minVotos}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(carrera)} title="Editar" className="transition hover:opacity-60">
                            <Pencil size={16} style={{ color: "#03AED2" }} />
                          </button>
                          <button onClick={() => handleDelete(carrera.id)} title="Eliminar" className="transition hover:opacity-60">
                            <Trash2 size={16} style={{ color: "#EF4444" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      {carreras.length === 0 ? "No hay carreras registradas." : "No hay resultados para los filtros aplicados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
          <div className="relative mx-4 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:mx-0 sm:p-8">
            <button onClick={closeModal} className="absolute right-5 top-5 text-gray-400 transition hover:text-gray-600">
              <X size={20} />
            </button>

            <h2 className="mb-6 text-lg font-bold" style={{ color: "#06065C" }}>
              {editingId !== null ? "Editar Carrera" : "Agregar Carrera"}
            </h2>

            <div className="space-y-4">
              <Field label="Nombre">
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder="Nombre de la carrera"
                />
              </Field>

              <Field label="Código">
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder="Ej: IS"
                  maxLength={20}
                />
              </Field>

              <Field label="Campus">
                <select
                  value={form.organizationId}
                  onChange={(e) => setForm((f) => ({ ...f, organizationId: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  style={{ color: form.organizationId ? "#1e293b" : "#9CA3AF" }}
                >
                  <option value="" disabled>Selecciona un campus</option>
                  {organizations.map((o) => (
                    <option key={o.organization_id} value={o.organization_id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Mínimo de Votos Requeridos">
                <input
                  type="number"
                  value={form.minVotos}
                  onChange={(e) => setForm((f) => ({ ...f, minVotos: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder="Ej: 10"
                  min={1}
                />
              </Field>
            </div>

            {modalError && (
              <p className="mt-3 text-sm text-red-500">{modalError}</p>
            )}

            <div className="mt-8 flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 rounded-xl border py-3 text-sm font-semibold transition hover:bg-gray-50"
                style={{ borderColor: "#06065C", color: "#06065C" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!isFormValid || saving}
                className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition"
                style={{
                  backgroundColor: isFormValid && !saving ? "#06065C" : "#94A3B8",
                  cursor: isFormValid && !saving ? "pointer" : "not-allowed",
                }}
              >
                {saving ? "Guardando…" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold" style={{ color: "#06065C" }}>
        {label}
      </label>
      {children}
    </div>
  )
}
