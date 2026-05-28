import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiUser,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
} from "@/services/admin.service"
import { Pencil, Plus, Trash2, X } from "lucide-react"

type UserStatus = "Activo" | "Inactivo"

const ROL_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "observer", label: "Observador" },
  { value: "auditor", label: "Auditor" },
  { value: "staff", label: "Staff" },
]

const ROL_ALL_LABELS: Record<string, string> = {
  admin: "Administrador",
  observer: "Observador",
  auditor: "Auditor",
  staff: "Staff",
  student: "Estudiante",
}

function rolLabel(role: string): string {
  return ROL_ALL_LABELS[role] ?? role
}

interface AdminUser {
  id: string
  nombre: string
  correo: string
  rol: string
  estado: UserStatus
}

interface FormState {
  nombre: string
  correo: string
  rol: string
}

const EMPTY_FORM: FormState = { nombre: "", correo: "", rol: "" }

function fromApi(u: ApiUser): AdminUser {
  return {
    id: u.user_id,
    nombre: u.full_name,
    correo: u.email,
    rol: u.role,
    estado: u.is_active ? "Activo" : "Inactivo",
  }
}

export default function AdminGestionUsuarios() {
  const { token } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const isFormValid = !!(form.nombre.trim() && form.correo.trim() && form.rol)

  async function loadData() {
    try {
      setLoading(true)
      setError(null)
      const data = await listAdminUsers(token!)
      setUsers(data.map(fromApi))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios")
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

  function openEdit(user: AdminUser) {
    setEditingId(user.id)
    setForm({ nombre: user.nombre, correo: user.correo, rol: user.rol })
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
      if (editingId !== null) {
        const updated = await updateAdminUser(token!, editingId, {
          full_name: form.nombre,
          email: form.correo,
          role: form.rol,
        })
        setUsers((prev) => prev.map((u) => (u.id === editingId ? fromApi(updated) : u)))
      } else {
        const created = await createAdminUser(token!, {
          full_name: form.nombre,
          email: form.correo,
          role: form.rol,
        })
        setUsers((prev) => [...prev, fromApi(created)])
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
      await deleteAdminUser(token!, id)
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setSelected((prev) => prev.filter((s) => s !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id])
  }

  function toggleAll() {
    setSelected(selected.length === users.length ? [] : users.map((u) => u.id))
  }

  const allSelected = users.length > 0 && selected.length === users.length

  return (
    <AdminLayout>
      <h1 className="mb-6 text-xl font-bold" style={{ color: "#06065C" }}>
        Configuración &gt; Gestión de Usuarios
      </h1>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex justify-end">
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            style={{ backgroundColor: "#06065C" }}
          >
            <Plus size={16} />
            Agregar Administrador
          </button>
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
                  {["Nombre", "Correo", "Rol", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-semibold" style={{ color: "#06065C" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSelected = selected.includes(user.id)
                  return (
                    <tr key={user.id} className="border-t border-gray-100 transition hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleSelect(user.id)}
                          className="flex h-5 w-5 items-center justify-center rounded-full border-2 transition"
                          style={{ borderColor: isSelected ? "#06065C" : "#CBD5E1", backgroundColor: isSelected ? "#06065C" : "transparent" }}
                        >
                          {isSelected && <span className="block h-2 w-2 rounded-full bg-white" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{user.nombre}</td>
                      <td className="px-4 py-3 text-gray-500">{user.correo}</td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={
                            user.rol === "student"
                              ? { backgroundColor: "#FEF3C7", color: "#92400E" }
                              : { backgroundColor: "#EFF6FF", color: "#1E40AF" }
                          }
                        >
                          {rolLabel(user.rol)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={{
                            backgroundColor: user.estado === "Activo" ? "#DCFCE7" : "#F1F5F9",
                            color: user.estado === "Activo" ? "#16A34A" : "#94A3B8",
                          }}
                        >
                          {user.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(user)} title="Editar" className="transition hover:opacity-60">
                            <Pencil size={16} style={{ color: "#03AED2" }} />
                          </button>
                          <button onClick={() => handleDelete(user.id)} title="Eliminar" className="transition hover:opacity-60">
                            <Trash2 size={16} style={{ color: "#EF4444" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                      No hay usuarios registrados.
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
              {editingId !== null ? "Editar Administrador" : "Agregar Administrador"}
            </h2>

            <div className="space-y-4">
              <Field label="Nombre">
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder="Nombre completo"
                />
              </Field>

              <Field label="Correo">
                <input
                  type="email"
                  value={form.correo}
                  onChange={(e) => setForm((f) => ({ ...f, correo: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  placeholder="correo@unitec.edu.hn"
                />
              </Field>

              <Field label="Rol">
                <select
                  value={form.rol}
                  onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-400"
                  style={{ color: form.rol ? "#1e293b" : "#9CA3AF" }}
                >
                  <option value="" disabled>Selecciona un rol</option>
                  {ROL_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
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
