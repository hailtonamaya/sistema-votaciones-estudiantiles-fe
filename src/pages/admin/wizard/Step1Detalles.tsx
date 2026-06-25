import { useEffect, useState } from "react"
import { ChevronRight, Save } from "lucide-react"
import { ErrorBanner } from "@/components/ErrorBanner"
import { SectionHeader } from "@/components/wizard/SectionHeader"
import { BtnPrimary, BtnSecondary, BtnAccent } from "@/components/wizard/WizardButtons"
import { WizardBottomBar } from "@/components/wizard/WizardBottomBar"
import { BRAND } from "@/lib/brand"
import {
  type ApiElection,
  type ApiOrganization,
  createElection,
  listOrganizations,
  updateElection,
} from "@/services/admin.service"

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toISO(local: string): string | undefined {
  return local ? new Date(local).toISOString() : undefined
}

interface Step1Props {
  election: ApiElection | null
  token: string
  isReadOnly?: boolean
  onSaved: (e: ApiElection) => void
  onSaveAndExit: (e: ApiElection) => void
  onCancel: () => void
}

export function Step1({ election, token, isReadOnly = false, onSaved, onSaveAndExit, onCancel }: Step1Props) {
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

  async function save(): Promise<ApiElection | null> {
    setError(null)
    if (!form.title.trim()) { setError("El nombre de la elección es requerido"); return null }
    if (!form.organization_id) { setError("Selecciona un campus"); return null }
    if (form.start_at && form.end_at && new Date(form.end_at) <= new Date(form.start_at)) {
      setError("La fecha de fin debe ser posterior a la fecha de inicio"); return null
    }
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

  const inputCls =
    `w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none ${
      isReadOnly
        ? "bg-gray-50 text-gray-500 cursor-not-allowed"
        : "focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
    }`

  return (
    <>
      <SectionHeader
        title="Detalles Generales"
        subtitle="Paso 1 de 5 - Configura los detalles de la elección."
      />
      {error && <ErrorBanner message={error} />}

      <div className="w-full space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
            Nombre de la Elección <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="Ej. Elecciones Estudiantiles 2026"
            className={inputCls}
            disabled={isReadOnly}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
            Campus <span className="text-red-500">*</span>
          </label>
          <select
            value={form.organization_id}
            onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value }))}
            className={inputCls}
            disabled={isReadOnly}
          >
            <option value="">Selecciona un campus</option>
            {orgs.map((o) => (
              <option key={o.organization_id} value={o.organization_id}>
                {o.name} ({o.code})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
              Fecha y Hora de Inicio
            </label>
            <input
              type="datetime-local"
              value={form.start_at}
              onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))}
              className={inputCls}
              disabled={isReadOnly}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
              Fecha y Hora de Fin
            </label>
            <input
              type="datetime-local"
              value={form.end_at}
              min={form.start_at || undefined}
              onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))}
              className={inputCls}
              disabled={isReadOnly}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: BRAND }}>
            Descripción / Mensaje de Bienvenida
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={4}
            placeholder="Mensaje que verán los votantes al iniciar el proceso de votación…"
            className={`${inputCls} resize-none`}
            disabled={isReadOnly}
          />
        </div>
      </div>

      <WizardBottomBar>
        {isReadOnly ? (
          <BtnSecondary onClick={onCancel}>Cerrar</BtnSecondary>
        ) : (
          <>
            <BtnSecondary onClick={onCancel}>Cancelar</BtnSecondary>
            <div className="ml-auto flex flex-wrap items-center gap-3">
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
              <BtnPrimary
                loading={saving}
                onClick={async () => {
                  const e = await save()
                  if (e) onSaved(e)
                }}
              >
                Guardar y Continuar
                <ChevronRight size={16} />
              </BtnPrimary>
            </div>
          </>
        )}
      </WizardBottomBar>
    </>
  )
}
