import { useEffect, useRef, useState } from "react"
import { ChevronRight, ImageIcon, Loader2, Plus, Save, Trash2, Users, X } from "lucide-react"
import { ErrorBanner } from "@/components/ErrorBanner"
import { EmptyState } from "@/components/EmptyState"
import { SectionHeader } from "@/components/wizard/SectionHeader"
import { BtnPrimary, BtnSecondary, BtnAccent } from "@/components/wizard/WizardButtons"
import { WizardBottomBar } from "@/components/wizard/WizardBottomBar"
import { BRAND, ACCENT } from "@/lib/brand"
import {
  type ApiAssociation,
  type ApiCareer,
  createAssociation,
  deleteAssociation,
  listAssociations,
  listCareers,
} from "@/services/admin.service"

interface Step2Props {
  electionId: string
  token: string
  organizationId?: string
  isReadOnly?: boolean
  hideHeader?: boolean
  onNext: () => void
  onBack: () => void
  onExit: () => void
}

export function Step2({ electionId, token, organizationId, isReadOnly = false, hideHeader = false, onNext, onBack, onExit }: Step2Props) {
  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [associations, setAssociations] = useState<ApiAssociation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCareerId, setActiveCareerId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", description: "", logo_url: "" })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    Promise.all([
      listCareers(token),
      listAssociations(token, { election_id: electionId }),
    ])
      .then(([c, a]) => { setCareers(c); setAssociations(a) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, electionId])

  const relevantCareers = (
    organizationId ? careers.filter((c) => c.organization_id === organizationId) : careers
  ).sort((a, b) => a.name.localeCompare(b.name))

  const assocByCareer = associations.reduce<Record<string, ApiAssociation[]>>((acc, a) => {
    const cid = a.election_career?.career?.career_id
    if (cid) { if (!acc[cid]) acc[cid] = []; acc[cid].push(a) }
    return acc
  }, {})

  function openForm(careerId: string) {
    setActiveCareerId(careerId)
    setForm({ name: "", description: "", logo_url: "" })
    setError(null)
  }

  async function handleCreate(careerId: string) {
    setError(null)
    if (!form.name.trim()) { setError("El nombre de la asociación es requerido"); return }
    setSaving(true)
    try {
      const created = await createAssociation(token, {
        election_id: electionId,
        career_id: careerId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        logo_url: form.logo_url || undefined,
      })
      // Enrich with career info so grouping works immediately without a refetch
      const career = careers.find((c) => c.career_id === careerId)
      const enriched: ApiAssociation = {
        ...created,
        election_career: {
          election_id: electionId,
          career_id: careerId,
          career: career
            ? { career_id: career.career_id, name: career.name, code: career.code }
            : null,
        },
      }
      setAssociations((prev) => [...prev, enriched])
      setActiveCareerId(null)
      setForm({ name: "", description: "", logo_url: "" })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear la asociación")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleteError(null)
    try {
      await deleteAssociation(token, id)
      setAssociations((prev) => prev.filter((a) => a.association_id !== id))
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Error al eliminar la planilla")
    }
  }

  const inputCls =
    "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"

  return (
    <>
      {!hideHeader && (
        <SectionHeader
          title="Asociaciones por Carrera"
          subtitle="Paso 2 de 5 - Registra las asociaciones que participarán en cada carrera."
        />
      )}

      {deleteError && <ErrorBanner message={deleteError} />}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : relevantCareers.length === 0 ? (
        <EmptyState
          icon={<Users size={30} style={{ color: ACCENT }} />}
          title="No hay carreras disponibles"
          description="Configura las carreras en la sección de gestión antes de crear asociaciones."
        />
      ) : (
        <div className="space-y-4">
          {relevantCareers.map((career) => {
            const assocs = assocByCareer[career.career_id] ?? []
            const isActive = activeCareerId === career.career_id

            return (
              <div
                key={career.career_id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                {/* Career header */}
                <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
                  <div className="flex flex-1 items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: BRAND }}>
                      {career.name}
                    </span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-600">
                      {career.code}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{assocs.length} asociación(es)</span>
                  {!isReadOnly && (
                    <button
                      onClick={() =>
                        isActive ? setActiveCareerId(null) : openForm(career.career_id)
                      }
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: isActive ? "#64748B" : BRAND }}
                    >
                      {isActive ? <X size={13} /> : <Plus size={13} />}
                      {isActive ? "Cancelar" : "Agregar Asociación"}
                    </button>
                  )}
                </div>

                {/* Inline add form */}
                {isActive && (
                  <div className="border-b border-blue-100 bg-blue-50/40 px-5 py-4">
                    {error && <ErrorBanner message={error} />}

                    {/* Logo upload */}
                    <div className="mb-4">
                      {form.logo_url ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={form.logo_url}
                            alt="preview"
                            className="h-16 w-16 rounded-xl border border-gray-200 object-cover"
                          />
                          <button
                            onClick={() => setForm((p) => ({ ...p, logo_url: "" }))}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Quitar imagen
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileRef.current?.click()}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-blue-200 bg-white px-4 py-3 transition hover:border-blue-400"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                            <ImageIcon size={16} className="text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Subir logo (opcional)
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG hasta 1MB</p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          if (file.size > 1 * 1024 * 1024) {
                            setError("La imagen no puede superar 1MB")
                            return
                          }
                          const reader = new FileReader()
                          reader.onload = (ev) =>
                            setForm((p) => ({ ...p, logo_url: ev.target?.result as string }))
                          reader.readAsDataURL(file)
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label
                          className="mb-1 block text-xs font-semibold"
                          style={{ color: BRAND }}
                        >
                          Nombre de la Asociación <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Ej. Planilla Progreso"
                          className={inputCls}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label
                          className="mb-1 block text-xs font-semibold"
                          style={{ color: BRAND }}
                        >
                          Descripción
                        </label>
                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            setForm((p) => ({ ...p, description: e.target.value }))
                          }
                          rows={2}
                          placeholder="Descripción opcional…"
                          className={`${inputCls} resize-none`}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <BtnSecondary onClick={() => setActiveCareerId(null)}>
                        Cancelar
                      </BtnSecondary>
                      <BtnPrimary
                        loading={saving}
                        onClick={() => handleCreate(career.career_id)}
                      >
                        <Save size={14} />
                        Guardar Asociación
                      </BtnPrimary>
                    </div>
                  </div>
                )}

                {/* Associations list */}
                {assocs.length === 0 && !isActive ? (
                  <p className="px-5 py-5 text-center text-sm text-gray-400">
                    Sin asociaciones — agrega la primera para esta carrera.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {assocs.map((assoc) => (
                      <div
                        key={assoc.association_id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        {assoc.logo_url ? (
                          <img
                            src={assoc.logo_url}
                            alt={assoc.name}
                            className="h-10 w-10 flex-shrink-0 rounded-lg border border-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-300">
                            <Users size={18} />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-sm font-semibold"
                            style={{ color: BRAND }}
                          >
                            {assoc.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {assoc.association_member?.length ?? 0} candidato(s)
                          </p>
                        </div>
                        {!isReadOnly && (
                          <button
                            onClick={() => handleDelete(assoc.association_id)}
                            aria-label={`Eliminar planilla ${assoc.name}`}
                            className="text-red-400 transition hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <WizardBottomBar>
        {isReadOnly ? (
          <BtnSecondary onClick={onExit}>Cerrar</BtnSecondary>
        ) : (
          <>
            <BtnSecondary onClick={onBack}>← Anterior</BtnSecondary>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <BtnAccent onClick={onExit}>
                <Save size={15} />
                Guardar y Salir
              </BtnAccent>
              <BtnPrimary onClick={onNext}>
                Continuar a Candidatos
                <ChevronRight size={16} />
              </BtnPrimary>
            </div>
          </>
        )}
      </WizardBottomBar>
    </>
  )
}
