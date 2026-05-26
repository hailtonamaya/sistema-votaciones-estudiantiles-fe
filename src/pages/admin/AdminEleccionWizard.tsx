import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiAssociation,
  type ApiAssociationMember,
  type ApiCareer,
  type ApiElection,
  type ApiOrganization,
  type ApiVoter,
  createAssociation,
  createAssociationMember,
  createElection,
  createVoter,
  deleteAssociation,
  deleteAssociationMember,
  deleteVoter,
  listAssociations,
  listCareers,
  listElections,
  listOrganizations,
  listVoters,
  transitionElection,
  updateElection,
} from "@/services/admin.service"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
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
  UserPlus,
  Users,
  X,
  XCircle,
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BRAND = "#06065C"
const ACCENT = "#03AED2"

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold" style={{ color: BRAND }}>{title}</h1>
      <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}

function BottomBar({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<Element | null>(null)
  useEffect(() => {
    setTarget(document.getElementById("admin-wizard-footer"))
  }, [])
  if (!target) return null
  return createPortal(
    <div
      className="flex items-center gap-3 border-t border-gray-200 bg-white px-6 py-4"
      style={{ boxShadow: "0 -2px 8px rgba(0,0,0,0.06)" }}
    >
      {children}
    </div>,
    target,
  )
}

function BtnPrimary({ children, onClick, disabled, loading }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: BRAND }}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}

function BtnSecondary({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      {children}
    </button>
  )
}

function BtnAccent({ children, onClick, disabled, loading }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: ACCENT }}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      <AlertCircle size={16} className="flex-shrink-0" />
      {message}
    </div>
  )
}

// ─── Step 1: Detalles Generales ────────────────────────────────────────────────

interface Step1Props {
  election: ApiElection | null
  onSaved: (e: ApiElection) => void
  onSaveAndExit: (e: ApiElection) => void
  onCancel: () => void
  token: string
}

function Step1({ election, onSaved, onSaveAndExit, onCancel, token }: Step1Props) {
  const [orgs, setOrgs] = useState<ApiOrganization[]>([])
  const [form, setForm] = useState({
    title: election?.title ?? "",
    organization_id: election?.organization_id ?? "",
    start_at: election?.start_at ? toDatetimeLocal(election.start_at) : "",
    end_at: election?.end_at ? toDatetimeLocal(election.end_at) : "",
    description: election?.description ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listOrganizations(token).then(setOrgs).catch(() => {})
  }, [token])

  function toDatetimeLocal(iso: string) {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  function toISO(local: string) {
    return local ? new Date(local).toISOString() : undefined
  }

  async function save(): Promise<ApiElection | null> {
    setError(null)
    if (!form.title.trim()) { setError("El nombre de la elección es requerido"); return null }
    if (!form.organization_id) { setError("Selecciona un campus"); return null }
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        organization_id: form.organization_id,
        start_at: toISO(form.start_at),
        end_at: toISO(form.end_at),
        description: form.description.trim() || undefined,
      }
      if (election) {
        return await updateElection(token, election.election_id, payload)
      }
      return await createElection(token, payload as Parameters<typeof createElection>[1])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar")
      return null
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <SectionHeader title="Detalles Generales" subtitle="Paso 1 de 5 - Configura los detalles de la elección." />
      {error && <ErrorBanner message={error} />}

      <div className="max-w-3xl space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
            Nombre de la Elección <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Ej. Elecciones Estudiantiles 2026"
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {/* Campus */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
            Campus <span className="text-red-500">*</span>
          </label>
          <select
            value={form.organization_id}
            onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Selecciona un campus</option>
            {orgs.map((o) => (
              <option key={o.organization_id} value={o.organization_id}>
                {o.name} ({o.code})
              </option>
            ))}
          </select>
        </div>

        {/* Date/Time row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
              Fecha y Hora de Inicio
            </label>
            <input
              type="datetime-local"
              value={form.start_at}
              onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
              Fecha y Hora de Fin
            </label>
            <input
              type="datetime-local"
              value={form.end_at}
              onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
            Descripción / Mensaje de Bienvenida
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
            placeholder="Mensaje que verán los votantes al iniciar el proceso de votación…"
            className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <BottomBar>
        <BtnSecondary onClick={onCancel}>Cancelar</BtnSecondary>
        <div className="ml-auto flex items-center gap-3">
          <BtnAccent
            loading={saving}
            onClick={async () => {
              const e = await save()
              if (e) onSaveAndExit(e)
            }}
          >
            <Save size={15} />
            Guardar y Salir
          </BtnAccent>
          <BtnAccent
            loading={saving}
            onClick={async () => {
              const e = await save()
              if (e) onSaved(e)
            }}
          >
            <Save size={15} />
            Guardar Cambios
          </BtnAccent>
          <BtnPrimary
            loading={saving}
            onClick={async () => {
              const e = await save()
              if (e) onSaved(e)
            }}
          >
            Continuar a Crear Asociaciones
            <ChevronRight size={16} />
          </BtnPrimary>
        </div>
      </BottomBar>
    </>
  )
}

// ─── Step 2: Asociaciones ──────────────────────────────────────────────────────

interface Step2Props {
  electionId: string
  token: string
  onNext: () => void
  onBack: () => void
  onExit: () => void
}

function Step2({ electionId, token, onNext, onBack, onExit }: Step2Props) {
  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [associations, setAssociations] = useState<ApiAssociation[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [view, setView] = useState<"grid" | "list">("list")
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    career_id: "",
    name: "",
    description: "",
    logo_url: "",
  })

  useEffect(() => {
    Promise.all([
      listCareers(token),
      listAssociations(token, { election_id: electionId }),
    ]).then(([c, a]) => {
      setCareers(c)
      setAssociations(a)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [token, electionId])

  async function handleCreate() {
    setError(null)
    if (!form.career_id) { setError("Selecciona una carrera"); return }
    if (!form.name.trim()) { setError("El nombre es requerido"); return }
    setSaving(true)
    try {
      const created = await createAssociation(token, {
        election_id: electionId,
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
      await deleteAssociation(token, id)
      setAssociations((prev) => prev.filter((a) => a.association_id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  const filtered = associations.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <>
      <SectionHeader title="Crear Asociaciones" subtitle="Paso 2 de 5 - Registra las asociaciones que participarán en la elección." />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
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

      {/* Add form panel */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: BRAND }}>Agregar Asociación</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
          </div>
          {error && <ErrorBanner message={error} />}

          {/* Image upload area */}
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
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  const reader = new FileReader()
                  reader.onload = (ev) => setForm((p) => ({ ...p, logo_url: ev.target?.result as string }))
                  reader.readAsDataURL(file)
                }
              }} />
            </div>
            {form.logo_url && (
              <div className="mt-2 flex items-center gap-2">
                <img src={form.logo_url} alt="preview" className="h-16 w-16 rounded-lg object-cover border border-gray-200" />
                <button onClick={() => setForm((p) => ({ ...p, logo_url: "" }))} className="text-xs text-red-500 hover:underline">Quitar imagen</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Career */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                Carrera <span className="text-red-500">*</span>
              </label>
              <select
                value={form.career_id}
                onChange={(e) => setForm((p) => ({ ...p, career_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="">Selecciona una carrera</option>
                {careers.map((c) => (
                  <option key={c.career_id} value={c.career_id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            {/* Name */}
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

            {/* Description */}
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
            <BtnSecondary onClick={() => setShowForm(false)}>Cancelar</BtnSecondary>
            <BtnPrimary loading={saving} onClick={handleCreate}>
              <Save size={15} />
              Guardar Cambios
            </BtnPrimary>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 px-8 shadow-sm text-center">
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
            const careerName = (assoc as { election_career?: { career?: { name: string } | null } | null }).election_career?.career?.name
            return (
              <div key={assoc.association_id} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm">
                {assoc.logo_url ? (
                  <img src={assoc.logo_url} alt={assoc.name} className="h-14 w-14 flex-shrink-0 rounded-lg object-cover border border-gray-100" />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-300">
                    <Users size={24} />
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

      <BottomBar>
        <BtnSecondary onClick={onBack}>← Anterior</BtnSecondary>
        <div className="ml-auto flex items-center gap-3">
          <BtnAccent onClick={onExit}><Save size={15} />Guardar y Salir</BtnAccent>
          <BtnPrimary onClick={onNext}>Continuar a Candidatos <ChevronRight size={16} /></BtnPrimary>
        </div>
      </BottomBar>
    </>
  )
}

// ─── Step 3: Candidatos ────────────────────────────────────────────────────────

interface Step3Props {
  electionId: string
  token: string
  onNext: () => void
  onBack: () => void
  onExit: () => void
}

function Step3({ electionId, token, onNext, onBack, onExit }: Step3Props) {
  const [associations, setAssociations] = useState<ApiAssociation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeAssoc, setActiveAssoc] = useState<string | null>(null)
  const [memberForm, setMemberForm] = useState({ full_name: "", role: "", photo_url: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAssociations(token, { election_id: electionId })
      .then(setAssociations)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, electionId])

  async function handleAddMember(assocId: string) {
    setError(null)
    if (!memberForm.full_name.trim()) { setError("El nombre del candidato es requerido"); return }
    setSaving(true)
    try {
      const member = await createAssociationMember(token, assocId, {
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
      await deleteAssociationMember(token, assocId, member.association_member_id)
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
    <>
      <SectionHeader title="Candidatos" subtitle="Paso 3 de 5 - Agrega los candidatos de cada asociación." />
      {error && <ErrorBanner message={error} />}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : associations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 px-8 shadow-sm text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <Users size={30} style={{ color: ACCENT }} />
          </div>
          <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>No hay asociaciones creadas</p>
          <p className="max-w-sm text-sm text-gray-500">
            Regresa al paso 2 para crear asociaciones antes de agregar candidatos.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {associations.map((assoc) => (
            <div key={assoc.association_id} className="rounded-2xl bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                {assoc.logo_url ? (
                  <img src={assoc.logo_url} alt={assoc.name} className="h-10 w-10 rounded-lg object-cover border border-gray-100" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-300">
                    <Users size={18} />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: BRAND }}>{assoc.name}</p>
                  <p className="text-xs text-gray-400">{assoc.association_member?.length ?? 0} candidato(s)</p>
                </div>
                <button
                  onClick={() => { setActiveAssoc(activeAssoc === assoc.association_id ? null : assoc.association_id); setError(null); setMemberForm({ full_name: "", role: "", photo_url: "" }) }}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: BRAND }}
                >
                  <UserPlus size={13} />
                  Agregar candidato
                </button>
              </div>

              {/* Member form */}
              {activeAssoc === assoc.association_id && (
                <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="Nombre completo *"
                      value={memberForm.full_name}
                      onChange={(e) => setMemberForm((p) => ({ ...p, full_name: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <input
                      type="text"
                      placeholder="Cargo / Rol"
                      value={memberForm.role}
                      onChange={(e) => setMemberForm((p) => ({ ...p, role: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                    <input
                      type="url"
                      placeholder="URL de foto (opcional)"
                      value={memberForm.photo_url}
                      onChange={(e) => setMemberForm((p) => ({ ...p, photo_url: e.target.value }))}
                      className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <BtnSecondary onClick={() => setActiveAssoc(null)}>Cancelar</BtnSecondary>
                    <BtnPrimary loading={saving} onClick={() => handleAddMember(assoc.association_id)}>
                      <Save size={14} />
                      Guardar
                    </BtnPrimary>
                  </div>
                </div>
              )}

              {/* Members list */}
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

      <BottomBar>
        <BtnSecondary onClick={onBack}>← Anterior</BtnSecondary>
        <div className="ml-auto flex items-center gap-3">
          <BtnAccent onClick={onExit}><Save size={15} />Guardar y Salir</BtnAccent>
          <BtnPrimary onClick={onNext}>Continuar a Votantes <ChevronRight size={16} /></BtnPrimary>
        </div>
      </BottomBar>
    </>
  )
}

// ─── Step 4: Votantes ──────────────────────────────────────────────────────────

interface Step4Props {
  electionId: string
  token: string
  onNext: () => void
  onBack: () => void
  onExit: () => void
}

function Step4({ electionId, token, onNext, onBack, onExit }: Step4Props) {
  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [voters, setVoters] = useState<ApiVoter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("list")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: "", institutional_id: "", email: "", career_id: "" })

  useEffect(() => {
    Promise.all([
      listCareers(token),
      listVoters(token, electionId),
    ]).then(([c, v]) => {
      setCareers(c)
      setVoters(v)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [token, electionId])

  async function handleCreate() {
    setError(null)
    if (!form.full_name.trim()) { setError("El nombre es requerido"); return }
    if (!form.institutional_id.trim()) { setError("El número de cuenta es requerido"); return }
    if (!form.email.trim()) { setError("El correo institucional es requerido"); return }
    if (!form.career_id) { setError("Selecciona una carrera"); return }
    setSaving(true)
    try {
      const created = await createVoter(token, {
        election_id: electionId,
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
      await deleteVoter(token, id)
      setVoters((prev) => prev.filter((v) => v.election_voter_id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar")
    }
  }

  function getVoterName(v: ApiVoter) {
    return v.full_name ?? v.student?.user?.full_name ?? "—"
  }
  function getVoterEmail(v: ApiVoter) {
    return v.email ?? v.student?.user?.email ?? "—"
  }
  function getVoterAccount(v: ApiVoter) {
    return v.institutional_id ?? v.student?.institutional_id ?? "—"
  }
  function getVoterCareer(v: ApiVoter) {
    return v.career?.name ?? "—"
  }

  const filtered = voters.filter((v) =>
    getVoterName(v).toLowerCase().includes(search.toLowerCase()) ||
    getVoterEmail(v).toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <>
      <SectionHeader title="Crear Votantes" subtitle="Paso 4 de 5 - Registra los estudiantes habilitados para votar." />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
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

      {/* Form panel */}
      {showForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: BRAND }}>Agregar Votante</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400 hover:text-gray-600" /></button>
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
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
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
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
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
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                Carrera <span className="text-red-500">*</span>
              </label>
              <select
                value={form.career_id}
                onChange={(e) => setForm((p) => ({ ...p, career_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="">Selecciona una carrera</option>
                {careers.map((c) => (
                  <option key={c.career_id} value={c.career_id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <BtnSecondary onClick={() => setShowForm(false)}>Cancelar</BtnSecondary>
            <BtnPrimary loading={saving} onClick={handleCreate}>
              <Save size={15} />
              Guardar Cambios
            </BtnPrimary>
          </div>
        </div>
      )}

      {/* Voters table/list */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : filtered.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 px-8 shadow-sm text-center">
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
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Nombre</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">N° Cuenta</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Correo</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Carrera</th>
                <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Votó</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((v) => (
                <tr key={v.election_voter_id} className="hover:bg-gray-50 transition">
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

      <BottomBar>
        <BtnSecondary onClick={onBack}>← Anterior</BtnSecondary>
        <div className="ml-auto flex items-center gap-3">
          <BtnAccent onClick={onExit}><Save size={15} />Guardar y Salir</BtnAccent>
          <BtnPrimary onClick={onNext}>Continuar a Revisión <ChevronRight size={16} /></BtnPrimary>
        </div>
      </BottomBar>
    </>
  )
}

// ─── Step 5: Revisión ──────────────────────────────────────────────────────────

interface Step5Props {
  electionId: string
  token: string
  onBack: () => void
  onFinish: () => void
}

type RevisionStatus = "ok" | "warning" | "incomplete"

interface RevisionRow {
  label: string
  detail: string | number
  status: RevisionStatus
  onVerify: () => void
}

function StatusBadge({ status }: { status: RevisionStatus }) {
  const cfg = {
    ok: { bg: "#DCFCE7", color: "#16A34A", icon: <CheckCircle2 size={14} />, label: "Completo" },
    warning: { bg: "#FEF9C3", color: "#A16207", icon: <AlertCircle size={14} />, label: "Revisar" },
    incomplete: { bg: "#FEE2E2", color: "#DC2626", icon: <XCircle size={14} />, label: "Incompleto" },
  }[status]
  return (
    <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
      {cfg.icon}
      {cfg.label}
    </div>
  )
}

function Step5({ electionId, token, onBack, onFinish }: Step5Props) {
  const [election, setElection] = useState<ApiElection | null>(null)
  const [assocCount, setAssocCount] = useState(0)
  const [voterCount, setVoterCount] = useState(0)
  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [simulateCareer, setSimulateCareer] = useState("")
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      listElections(token).then((list) => list.find((e) => e.election_id === electionId) ?? null),
      listAssociations(token, { election_id: electionId }),
      listVoters(token, electionId),
      listCareers(token),
    ]).then(([el, assocs, voters, c]) => {
      setElection(el)
      setAssocCount(assocs.length)
      setVoterCount(voters.length)
      setCareers(c)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [token, electionId])

  async function handleActivate() {
    if (!election) return
    const nextStatus = election.status === "draft" ? "scheduled" : "open"
    setActivating(true)
    try {
      await transitionElection(token, electionId, nextStatus)
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

  const rows: RevisionRow[] = [
    { label: "Detalles generales", detail: "Nombre, Fecha, Hora y más…", status: electionOk, onVerify: () => navigate(`/admin/elecciones/wizard?id=${electionId}&step=1`) },
    { label: "Cantidad de asociaciones", detail: assocCount, status: assocStatus, onVerify: () => navigate(`/admin/elecciones/wizard?id=${electionId}&step=2`) },
    { label: "Cantidad de votantes", detail: voterCount, status: voterStatus, onVerify: () => navigate(`/admin/elecciones/wizard?id=${electionId}&step=4`) },
  ]

  return (
    <>
      <SectionHeader title="Revisión" subtitle="Paso 5 de 5 - Revisión." />
      <p className="mb-6 text-sm text-gray-600">Antes de iniciar la votación debes completar las siguientes tareas.</p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
      ) : (
        <div className="max-w-3xl rounded-2xl bg-white p-8 shadow-sm space-y-8">
          {/* Summary */}
          <div>
            <h2 className="mb-4 text-lg font-bold" style={{ color: BRAND }}>Resumen de Elección</h2>
            <div className="space-y-4">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center gap-4">
                  <p className="flex-1 text-sm text-gray-700">{row.label}</p>
                  <span className="text-sm text-gray-400 min-w-[80px] text-right">{row.detail}</span>
                  <button
                    onClick={row.onVerify}
                    className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    style={{ backgroundColor: BRAND }}
                  >
                    Verificar
                  </button>
                  <StatusBadge status={row.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Simulate */}
          <div>
            <h2 className="mb-4 text-lg font-bold" style={{ color: BRAND }}>Probar experiencia de votación</h2>
            <div className="flex items-center gap-3">
              <select
                value={simulateCareer}
                onChange={(e) => setSimulateCareer(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
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

          {/* Election status */}
          {election && (
            <div className="rounded-xl bg-gray-50 px-5 py-4 text-sm text-gray-600">
              Estado actual:{" "}
              <span className="font-semibold" style={{ color: BRAND }}>
                {election.status === "draft" ? "Borrador" : election.status === "scheduled" ? "Programada" : election.status === "open" ? "Activa" : election.status}
              </span>
            </div>
          )}
        </div>
      )}

      <BottomBar>
        <BtnSecondary onClick={onBack}>← Anterior</BtnSecondary>
        <div className="ml-auto flex items-center gap-3">
          <BtnAccent onClick={onFinish}><Save size={15} />Guardar y Salir</BtnAccent>
          {election && election.status !== "open" && election.status !== "closed" && election.status !== "cancelled" && (
            <BtnPrimary loading={activating} onClick={handleActivate}>
              {election.status === "draft" ? "Programar Elección" : "Iniciar Elección"}
              <ChevronRight size={16} />
            </BtnPrimary>
          )}
        </div>
      </BottomBar>
    </>
  )
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────

export default function AdminEleccionWizard() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const step = Math.max(1, Math.min(5, Number(searchParams.get("step")) || 1)) as 1 | 2 | 3 | 4 | 5
  const electionId = searchParams.get("id") ?? null

  const [election, setElection] = useState<ApiElection | null>(null)

  // Load election data when arriving in edit mode (id already in URL)
  useEffect(() => {
    if (electionId && !election) {
      listElections(token!)
        .then((list) => {
          const found = list.find((e) => e.election_id === electionId) ?? null
          if (found) setElection(found)
        })
        .catch(() => {})
    }
  }, [electionId]) // eslint-disable-line react-hooks/exhaustive-deps

  function goTo(s: number, id?: string) {
    const p: Record<string, string> = { step: String(s) }
    const eid = id ?? electionId
    if (eid) p.id = eid
    setSearchParams(p, { replace: true })
  }

  function handleExit() {
    navigate("/admin/elecciones/detalles")
  }

  const titles: Record<number, string> = {
    1: "Detalles Generales",
    2: "Crear Asociaciones",
    3: "Candidatos",
    4: "Crear Votantes",
    5: "Revisión",
  }

  return (
    <AdminLayout>
      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition"
              style={{
                backgroundColor: s === step ? BRAND : s < step ? ACCENT : "#E5E7EB",
                color: s <= step ? "#fff" : "#9CA3AF",
              }}
            >
              {s < step ? <CheckCircle2 size={14} /> : s}
            </div>
            {s < 5 && <div className="h-0.5 w-8 rounded" style={{ backgroundColor: s < step ? ACCENT : "#E5E7EB" }} />}
          </div>
        ))}
        <span className="ml-3 text-sm font-medium text-gray-500">{titles[step]}</span>
      </div>

      {step === 1 && (
        <Step1
          election={election}
          token={token!}
          onSaved={(e) => { setElection(e); goTo(2, e.election_id) }}
          onSaveAndExit={(e) => { setElection(e); handleExit() }}
          onCancel={handleExit}
        />
      )}
      {step === 2 && electionId && (
        <Step2
          electionId={electionId}
          token={token!}
          onNext={() => goTo(3)}
          onBack={() => goTo(1)}
          onExit={handleExit}
        />
      )}
      {step === 3 && electionId && (
        <Step3
          electionId={electionId}
          token={token!}
          onNext={() => goTo(4)}
          onBack={() => goTo(2)}
          onExit={handleExit}
        />
      )}
      {step === 4 && electionId && (
        <Step4
          electionId={electionId}
          token={token!}
          onNext={() => goTo(5)}
          onBack={() => goTo(3)}
          onExit={handleExit}
        />
      )}
      {step === 5 && electionId && (
        <Step5
          electionId={electionId}
          token={token!}
          onBack={() => goTo(4)}
          onFinish={handleExit}
        />
      )}
    </AdminLayout>
  )
}
