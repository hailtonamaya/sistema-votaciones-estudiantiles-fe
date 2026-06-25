import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiOrganization,
  listOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from "@/services/admin.service"
import { Pencil, Plus, Search, Trash2, X } from "lucide-react"

type CampusStatus = "Activo" | "Inactivo"

interface Campus {
  id: string
  nombre: string
  codigo: string
  ubicacion: string
  estado: CampusStatus
}

interface FormState {
  nombre: string
  codigo: string
  ubicacion: string
  estado: CampusStatus
}

const EMPTY_FORM: FormState = { nombre: "", codigo: "", ubicacion: "", estado: "Activo" }

function fromApi(o: ApiOrganization): Campus {
  return {
    id: o.organization_id,
    nombre: o.name,
    codigo: o.code,
    ubicacion: o.location ?? "",
    estado: o.is_active ? "Activo" : "Inactivo",
  }
}

export default function AdminBancoCampus() {
  const { token } = useAuth()
  const [campuses, setCampuses] = useState<Campus[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const [search, setSearch] = useState("")
  const [filterEstado, setFilterEstado] = useState("")

  const isFormValid = !!(form.nombre.trim() && form.codigo.trim() && form.ubicacion.trim())

  const filtered = campuses.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.nombre.toLowerCase().includes(q) ||
      c.codigo.toLowerCase().includes(q) ||
      c.ubicacion.toLowerCase().includes(q)
    const matchEstado = !filterEstado || c.estado === filterEstado
    return matchSearch && matchEstado
  })

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const data = await listOrganizations(token!)
      setCampuses(data.map(fromApi))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar campus")
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

  function openEdit(campus: Campus) {
    setEditingId(campus.id)
    setForm({ nombre: campus.nombre, codigo: campus.codigo, ubicacion: campus.ubicacion, estado: campus.estado })
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
      const body = { name: form.nombre, code: form.codigo, location: form.ubicacion }
      if (editingId !== null) {
        const updated = await updateOrganization(token!, editingId, {
          ...body,
          is_active: form.estado === "Activo",
        })
        setCampuses((prev) => prev.map((c) => (c.id === editingId ? fromApi(updated) : c)))
      } else {
        const created = await createOrganization(token!, body)
        setCampuses((prev) => [...prev, fromApi(created)])
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
      await deleteOrganization(token!, id)
      setCampuses((prev) => prev.filter((c) => c.id !== id))
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
        Configuración &gt; Banco de Campus
      </h1>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <Search size={14} className="flex-shrink-0 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o ubicación…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 bg-transparent text-sm outline-none placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-gray-300 hover:text-gray-500">
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>

          {(search || filterEstado) && (
            <button
              onClick={() => { setSearch(""); setFilterEstado("") }}
              className="text-xs text-gray-400 underline hover:text-gray-600"
            >
              Limpiar filtros
            </button>
          )}

          <span className="text-xs text-gray-400">
            {filtered.length} de {campuses.length} campus
          </span>

          <div className="ml-auto">
            <button
              onClick={openAdd}
              className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: "#06065C" }}
            >
              <Plus size={16} />
              Agregar Campus
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
                  {["Nombre", "Código", "Ubicación", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "#06065C" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((campus) => {
                  const isSelected = selected.includes(campus.id)
                  return (
                    <tr key={campus.id} className="border-t border-gray-100 transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(campus.id)}
                          className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition"
                          style={{ borderColor: isSelected ? "#06065C" : "#CBD5E1", backgroundColor: isSelected ? "#06065C" : "transparent" }}
                        >
                          {isSelected && <span className="block h-2 w-2 rounded-full bg-white" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{campus.nombre}</td>
                      <td className="px-4 py-3 text-gray-500">{campus.codigo}</td>
                      <td className="px-4 py-3 text-gray-500">{campus.ubicacion}</td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: campus.estado === "Activo" ? "#DCFCE7" : "#F1F5F9",
                            color: campus.estado === "Activo" ? "#16A34A" : "#94A3B8",
                          }}
                        >
                          {campus.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(campus)} title="Editar" className="transition hover:opacity-60">
                            <Pencil size={16} style={{ color: "#03AED2" }} />
                          </button>
                          <button onClick={() => handleDelete(campus.id)} title="Eliminar" className="transition hover:opacity-60">
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
                      {campuses.length === 0 ? "No hay campus registrados." : "No hay resultados para los filtros aplicados."}
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
              {editingId !== null ? "Editar Campus" : "Agregar Campus"}
            </h2>

            <div className="space-y-4">
              <Field label="Nombre">
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder="Nombre del campus"
                />
              </Field>

              <Field label="Código">
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder="Ej: SPS"
                  maxLength={20}
                />
              </Field>

              <Field label="Ubicación">
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder="Ciudad, Departamento"
                />
              </Field>

              <Field label="Estado">
                <select
                  value={form.estado}
                  onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value as CampusStatus }))}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
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
