import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiAssociation,
  type ApiAssociationMember,
  type ApiElection,
  createAssociationMember,
  deleteAssociationMember,
  listAssociations,
  listElections,
} from "@/services/admin.service"
import {
  AlertCircle,
  Loader2,
  Save,
  Trash2,
  UserPlus,
  Users,
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

export default function AdminEleccionCandidatos() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const [elections, setElections] = useState<ApiElection[]>([])
  const [associations, setAssociations] = useState<ApiAssociation[]>([])
  const [loadingElections, setLoadingElections] = useState(true)
  const [loading, setLoading] = useState(false)
  const [activeAssoc, setActiveAssoc] = useState<string | null>(null)
  const [memberForm, setMemberForm] = useState({ full_name: "", role: "", photo_url: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedId = searchParams.get("election_id") ?? ""

  useEffect(() => {
    listElections(token!)
      .then(setElections)
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
    setActiveAssoc(null)
    setError(null)
  }

  async function handleAddMember(assocId: string) {
    setError(null)
    if (!memberForm.full_name.trim()) { setError("El nombre del candidato es requerido"); return }
    setSaving(true)
    try {
      const member = await createAssociationMember(token!, assocId, {
        full_name: memberForm.full_name.trim(),
        role: memberForm.role.trim() || undefined,
        photo_url: memberForm.photo_url.trim() || undefined,
      })
      setAssociations((prev) =>
        prev.map((a) =>
          a.association_id === assocId
            ? { ...a, association_member: [...(a.association_member ?? []), member] }
            : a,
        ),
      )
      setMemberForm({ full_name: "", role: "", photo_url: "" })
      setActiveAssoc(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al agregar candidato")
    } finally {
      setSaving(false)
    }
  }

  async function handleRemoveMember(assocId: string, member: ApiAssociationMember) {
    try {
      await deleteAssociationMember(token!, assocId, member.association_member_id)
      setAssociations((prev) =>
        prev.map((a) =>
          a.association_id === assocId
            ? { ...a, association_member: (a.association_member ?? []).filter((m) => m.association_member_id !== member.association_member_id) }
            : a,
        ),
      )
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  return (
    <AdminLayout>
      <h1 className="mb-6 text-xl font-bold" style={{ color: BRAND }}>
        Elecciones &gt; Candidatos
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
            Elige una elección en el selector de arriba para ver y gestionar sus candidatos.
          </p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : associations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 px-8 shadow-sm text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Users size={30} style={{ color: ACCENT }} />
          </div>
          <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>No hay asociaciones creadas</p>
          <p className="max-w-sm text-sm text-gray-500">
            Esta elección no tiene asociaciones. Ve a la sección de Asociaciones para crearlas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <ErrorBanner message={error} />}
          {associations.map((assoc) => (
            <div key={assoc.association_id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
              {/* Association header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                {assoc.logo_url ? (
                  <img src={assoc.logo_url} alt={assoc.name} className="h-10 w-10 rounded-lg object-cover border border-gray-100" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Users size={18} style={{ color: ACCENT }} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: BRAND }}>{assoc.name}</p>
                  <p className="text-xs text-gray-400">{assoc.association_member?.length ?? 0} candidato(s)</p>
                </div>
                <button
                  onClick={() => {
                    setActiveAssoc(activeAssoc === assoc.association_id ? null : assoc.association_id)
                    setError(null)
                    setMemberForm({ full_name: "", role: "", photo_url: "" })
                  }}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: BRAND }}
                >
                  <UserPlus size={13} />
                  Agregar candidato
                </button>
              </div>

              {/* Add candidate form */}
              {activeAssoc === assoc.association_id && (
                <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={memberForm.full_name}
                      onChange={(e) => setMemberForm((p) => ({ ...p, full_name: e.target.value }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <input
                      type="text"
                      placeholder="Cargo / Rol"
                      value={memberForm.role}
                      onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <input
                      type="url"
                      placeholder="URL de foto (opcional)"
                      value={memberForm.photo_url}
                      onChange={(e) => setMemberForm((p) => ({ ...p, photo_url: e.target.value }))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => setActiveAssoc(null)}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAddMember(assoc.association_id)}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: BRAND }}
                    >
                      {saving && <Loader2 size={13} className="animate-spin" />}
                      <Save size={14} />
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {/* Candidates list */}
              {(assoc.association_member ?? []).length > 0 ? (
                <div className="divide-y divide-gray-50 px-5">
                  {(assoc.association_member ?? []).map((m) => (
                    <div key={m.association_member_id} className="flex items-center gap-3 py-3">
                      {m.photo_url ? (
                        <img src={m.photo_url} alt={m.full_name} className="h-8 w-8 rounded-full object-cover border border-gray-100" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-400">
                          {m.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{m.full_name}</p>
                        {m.role && <p className="text-xs text-gray-400">{m.role}</p>}
                      </div>
                      <button onClick={() => handleRemoveMember(assoc.association_id, m)} className="text-red-400 hover:text-red-600 transition">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-5 py-3 text-xs text-gray-400">Sin candidatos registrados.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
