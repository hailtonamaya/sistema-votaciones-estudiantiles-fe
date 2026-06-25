import { useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  Search,
  Star,
  Trash2,
  Users,
  X,
} from "lucide-react"
import { ErrorBanner } from "@/components/ErrorBanner"
import { EmptyState } from "@/components/EmptyState"
import { SectionHeader } from "@/components/wizard/SectionHeader"
import { BtnPrimary, BtnSecondary, BtnAccent } from "@/components/wizard/WizardButtons"
import { WizardBottomBar } from "@/components/wizard/WizardBottomBar"
import { WizardToolbar } from "@/components/wizard/WizardToolbar"
import { BRAND, ACCENT } from "@/lib/brand"
import {
  type ApiCareer,
  type ApiVoter,
  type ImportVoterRow,
  type ImportVotersResult,
  createVoter,
  deleteVoter,
  importVoters,
  listCareers,
  listVoters,
} from "@/services/admin.service"

interface Step4Props {
  electionId: string
  token: string
  isReadOnly?: boolean
  hideHeader?: boolean
  onNext: () => void
  onBack: () => void
  onExit: () => void
}

interface DualEntry {
  institutional_id: string
  full_name: string
  email: string
  is_on_campus: boolean
  careers: Array<{ career_id: string; code: string; name: string }>
}

function parseModality(val?: string): boolean {
  if (!val) return true
  return !["virtual", "v", "0", "false"].includes(val.toLowerCase())
}

function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(",").map((c) => c.trim()))
    .filter((row) => row.some((c) => c !== ""))
}

export function Step4({ electionId, token, isReadOnly = false, hideHeader = false, onNext, onBack, onExit }: Step4Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [voters, setVoters] = useState<ApiVoter[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState("")
  const [view, setView] = useState<"grid" | "list">("list")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({
    full_name: "", institutional_id: "", email: "", career_id: "", career_id_2: "", primary_career: "1", is_on_campus: true,
  })
  const [isDual, setIsDual] = useState(false)

  // CSV import state
  const [importRows, setImportRows] = useState<ImportVoterRow[] | null>(null)
  const [dualEntries, setDualEntries] = useState<DualEntry[]>([])
  const [primaryMap, setPrimaryMap] = useState<Record<string, string>>({})
  const [importParseErrors, setImportParseErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportVotersResult | null>(null)

  useEffect(() => {
    Promise.all([listCareers(token), listVoters(token, electionId)])
      .then(([c, v]) => { setCareers(c); setVoters(v) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, electionId])

  async function handleCreate() {
    setError(null)
    if (!form.full_name.trim()) { setError("El nombre es requerido"); return }
    if (!form.institutional_id.trim()) { setError("El número de cuenta es requerido"); return }
    if (!form.email.trim()) { setError("El correo institucional es requerido"); return }
    if (!form.career_id) { setError("Selecciona una carrera"); return }
    if (isDual) {
      if (!form.career_id_2) { setError("Selecciona la segunda carrera"); return }
      if (form.career_id === form.career_id_2) { setError("Las dos carreras deben ser diferentes"); return }
    }
    setSaving(true)
    try {
      const isPrimary1 = !isDual || form.primary_career === "1"
      const voterBase = {
        institutional_id: form.institutional_id.trim(),
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        is_active: true,
        is_on_campus: form.is_on_campus,
      }
      const v1 = await createVoter(token, {
        election_id: electionId,
        career_id: form.career_id,
        full_name: form.full_name.trim(),
        institutional_id: form.institutional_id.trim(),
        email: form.email.trim(),
        is_primary: isPrimary1,
        is_on_campus: form.is_on_campus,
      })
      const career1 = careers.find((c) => c.career_id === form.career_id)
      const newVoters: ApiVoter[] = [{
        ...v1,
        voter: { voter_id: v1.voter_id, ...voterBase },
        career: career1 ? { career_id: career1.career_id, name: career1.name, code: career1.code } : null,
      }]
      if (isDual) {
        const v2 = await createVoter(token, {
          election_id: electionId,
          career_id: form.career_id_2,
          full_name: form.full_name.trim(),
          institutional_id: form.institutional_id.trim(),
          email: form.email.trim(),
          is_primary: !isPrimary1,
          is_on_campus: form.is_on_campus,
        })
        const career2 = careers.find((c) => c.career_id === form.career_id_2)
        newVoters.push({
          ...v2,
          voter: { voter_id: v2.voter_id, ...voterBase },
          career: career2 ? { career_id: career2.career_id, name: career2.name, code: career2.code } : null,
        })
      }
      setVoters((prev) => [...prev, ...newVoters])
      setForm({ full_name: "", institutional_id: "", email: "", career_id: "", career_id_2: "", primary_career: "1", is_on_campus: true })
      setIsDual(false)
      setShowForm(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al agregar votante")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleteError(null)
    try {
      await deleteVoter(token, id)
      setVoters((prev) => prev.filter((v) => v.election_voter_id !== id))
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Error al eliminar el votante")
    }
  }

  function resetImport() {
    setImportRows(null)
    setDualEntries([])
    setPrimaryMap({})
    setImportParseErrors([])
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = parseCSV(text)
      if (lines.length < 2) {
        setImportParseErrors(["El archivo CSV está vacío o no tiene filas de datos."])
        setImportRows(null)
        setDualEntries([])
        return
      }

      const [, ...dataRows] = lines
      const errs: string[] = []
      const allParsed: Array<{ institutional_id: string; full_name: string; email: string; career_id: string; is_on_campus: boolean }> = []

      dataRows.forEach((cols, i) => {
        const [institutional_id, full_name, email, career_code, modality] = cols
        if (!institutional_id || !full_name || !email || !career_code) {
          errs.push(`Fila ${i + 2}: faltan columnas (se esperan: numero_cuenta, nombre_completo, correo, codigo_carrera[, modalidad])`)
          return
        }
        const career = careers.find((c) => c.code.toLowerCase() === career_code.toLowerCase())
        if (!career) {
          errs.push(`Fila ${i + 2}: código de carrera desconocido "${career_code}"`)
          return
        }
        allParsed.push({ institutional_id, full_name, email, career_id: career.career_id, is_on_campus: parseModality(modality) })
      })

      // Group by institutional_id to detect dual-degree students
      const grouped = new Map<string, typeof allParsed>()
      for (const row of allParsed) {
        const existing = grouped.get(row.institutional_id) ?? []
        grouped.set(row.institutional_id, [...existing, row])
      }

      const singles: ImportVoterRow[] = []
      const duals: DualEntry[] = []

      for (const [, group] of grouped) {
        if (group.length === 1) {
          singles.push({ ...group[0], is_primary: true })
        } else if (group.length === 2) {
          if (group[0].career_id === group[1].career_id) {
            errs.push(`El estudiante ${group[0].institutional_id} aparece dos veces con la misma carrera`)
          } else {
            duals.push({
              institutional_id: group[0].institutional_id,
              full_name: group[0].full_name,
              email: group[0].email,
              is_on_campus: group[0].is_on_campus,
              careers: group.map((r) => {
                const c = careers.find((cc) => cc.career_id === r.career_id)!
                return { career_id: r.career_id, code: c.code, name: c.name }
              }),
            })
          }
        } else {
          errs.push(`El estudiante ${group[0].institutional_id} aparece más de 2 veces en el archivo`)
        }
      }

      setImportParseErrors(errs)
      setImportRows(singles.length > 0 ? singles : null)
      setDualEntries(duals)
      setPrimaryMap({})
      setImportResult(null)
      setShowForm(false)
    }
    reader.readAsText(file)
  }

  async function handleImportConfirm() {
    const totalRows = (importRows?.length ?? 0) + dualEntries.length * 2
    if (totalRows === 0) return
    setImporting(true)
    try {
      const allRows: ImportVoterRow[] = [
        ...(importRows ?? []),
        ...dualEntries.flatMap((d) =>
          d.careers.map((c) => ({
            institutional_id: d.institutional_id,
            full_name: d.full_name,
            email: d.email,
            career_id: c.career_id,
            is_primary: primaryMap[d.institutional_id] === c.career_id,
            is_on_campus: d.is_on_campus,
          }))
        ),
      ]
      const result = await importVoters(token, electionId, allRows)
      setImportResult(result)
      resetImport()
      const updated = await listVoters(token, electionId)
      setVoters(updated)
    } catch (e) {
      setImportParseErrors([e instanceof Error ? e.message : "Error al importar"])
    } finally {
      setImporting(false)
    }
  }

  const filtered = voters.filter(
    (v) =>
      (v.voter?.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.voter?.email ?? "").toLowerCase().includes(search.toLowerCase()),
  )

  const dualVoterIds = new Set(
    Object.entries(
      voters.reduce((acc, v) => { acc[v.voter_id] = (acc[v.voter_id] ?? 0) + 1; return acc }, {} as Record<string, number>)
    ).filter(([, count]) => count > 1).map(([id]) => id)
  )

  const allDualsPrimarySelected = dualEntries.every((d) => !!primaryMap[d.institutional_id])
  const hasImportContent = (importRows?.length ?? 0) > 0 || dualEntries.length > 0
  const canConfirm = hasImportContent && allDualsPrimarySelected

  const inputCls = "w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
  const showImportPanel = importRows !== null || dualEntries.length > 0 || importParseErrors.length > 0

  return (
    <>
      {!hideHeader && (
        <SectionHeader
          title="Crear Votantes"
          subtitle="Paso 4 de 5 - Registra los estudiantes habilitados para votar."
        />
      )}
      {deleteError && <ErrorBanner message={deleteError} />}

      {/* Hidden file input for CSV */}
      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} />

      {isReadOnly ? (
        <div className="mb-5 flex items-center gap-3">
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
        </div>
      ) : (
        <WizardToolbar
          search={search}
          onSearchChange={setSearch}
          view={view}
          onViewChange={setView}
          addLabel="Agregar Votante"
          onAdd={() => { setShowForm(true); setError(null); resetImport() }}
          importLabel="Importar CSV"
          onImport={() => { fileRef.current?.click(); setShowForm(false) }}
        />
      )}

      {/* CSV import preview panel */}
      {showImportPanel && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: BRAND }}>Vista previa de importación</h3>
            <button onClick={resetImport}>
              <X size={18} className="text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          <p className="mb-3 text-xs text-gray-400">
            Formato:{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5">numero_cuenta,nombre_completo,correo,codigo_carrera,modalidad</code>
            {" "}— <code className="rounded bg-gray-100 px-1 py-0.5">modalidad</code>: <strong>presencial</strong> o <strong>virtual</strong> (opcional). Para doble titulación, repite la fila con el segundo código de carrera.
          </p>

          {importParseErrors.length > 0 && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1 text-xs font-semibold text-amber-700">
                {importParseErrors.length} fila{importParseErrors.length !== 1 ? "s" : ""} con error (serán ignoradas):
              </p>
              <ul className="space-y-0.5 text-xs text-amber-600">
                {importParseErrors.map((err, i) => <li key={i}>• {err}</li>)}
              </ul>
            </div>
          )}

          {/* Regular voters table */}
          {importRows && importRows.length > 0 && (
            <>
              <p className="mb-2 text-sm font-medium text-gray-700">
                {importRows.length} votante{importRows.length !== 1 ? "s" : ""} estándar
              </p>
              <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-gray-100">
                <table className="w-full min-w-[480px] text-xs">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr>
                      {["N° Cuenta", "Nombre", "Correo", "Carrera", "Modalidad"].map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {importRows.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-500">{r.institutional_id}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{r.full_name}</td>
                        <td className="px-3 py-2 text-gray-500">{r.email}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {careers.find((c) => c.career_id === r.career_id)?.code ?? r.career_id}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${
                            r.is_on_campus !== false ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          }`}>
                            {r.is_on_campus !== false ? "Presencial" : "Virtual"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Dual-degree section */}
          {dualEntries.length > 0 && (
            <div className={importRows && importRows.length > 0 ? "mt-4 border-t border-amber-100 pt-4" : ""}>
              <div className="mb-3 flex items-center gap-2">
                <GraduationCap size={15} className="text-amber-500" />
                <p className="text-sm font-semibold text-amber-700">
                  {dualEntries.length} estudiante{dualEntries.length !== 1 ? "s" : ""} de doble titulación
                </p>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                Selecciona la carrera <strong>principal</strong> (por la que votarán primero) para cada estudiante:
              </p>
              <div className="space-y-3">
                {dualEntries.map((d) => (
                  <div key={d.institutional_id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-2.5 text-sm font-semibold text-gray-800">
                      {d.full_name}
                      <span className="ml-2 font-mono text-xs font-normal text-gray-400">{d.institutional_id}</span>
                      <span className="ml-1 text-xs font-normal text-gray-400">· {d.email}</span>
                      <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                        d.is_on_campus ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>
                        {d.is_on_campus ? "Presencial" : "Virtual"}
                      </span>
                    </p>
                    <div className="space-y-1.5">
                      {d.careers.map((c) => {
                        const isPrimary = primaryMap[d.institutional_id] === c.career_id
                        return (
                          <label
                            key={c.career_id}
                            className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition ${
                              isPrimary ? "bg-amber-100" : "hover:bg-amber-100/60"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`primary-${d.institutional_id}`}
                              value={c.career_id}
                              checked={isPrimary}
                              onChange={() => setPrimaryMap((p) => ({ ...p, [d.institutional_id]: c.career_id }))}
                              className="accent-amber-500"
                            />
                            <span className="text-sm text-gray-700">
                              <span className="font-mono font-semibold text-amber-700">{c.code}</span>
                              {" — "}{c.name}
                            </span>
                            {isPrimary && (
                              <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                <Star size={10} />
                                Principal
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                    {!primaryMap[d.institutional_id] && (
                      <p className="mt-2 text-xs text-amber-600">Selecciona la carrera principal para continuar.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasImportContent && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              {dualEntries.length > 0 && !allDualsPrimarySelected && (
                <p className="text-xs text-amber-600">
                  Selecciona la carrera principal de todos los estudiantes de doble titulación.
                </p>
              )}
              <div className="ml-auto flex gap-3">
                <BtnSecondary onClick={resetImport}>Cancelar</BtnSecondary>
                <BtnPrimary loading={importing} onClick={handleImportConfirm} disabled={!canConfirm}>
                  Confirmar importación
                </BtnPrimary>
              </div>
            </div>
          )}

          {!hasImportContent && importParseErrors.length === 0 && (
            <p className="text-sm text-gray-400">No hay filas válidas para importar. Revisa el formato del archivo.</p>
          )}
        </div>
      )}

      {/* Import result banner */}
      {importResult && (
        <div className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-700">
                {importResult.created} votante{importResult.created !== 1 ? "s" : ""} importado{importResult.created !== 1 ? "s" : ""},
                {" "}{importResult.skipped} omitido{importResult.skipped !== 1 ? "s" : ""}
              </p>
              {importResult.errors.length > 0 && (
                <p className="mt-0.5 text-xs text-amber-600">
                  {importResult.errors.length} fila{importResult.errors.length !== 1 ? "s" : ""} no se pudo{importResult.errors.length !== 1 ? "n" : ""} importar.
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setImportResult(null)} className="flex-shrink-0 text-green-500 hover:text-green-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Add voter form */}
      {!isReadOnly && showForm && (
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold" style={{ color: BRAND }}>Agregar Votante</h3>
            <button onClick={() => { setShowForm(false); setIsDual(false) }}>
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
                className={inputCls}
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
                className={inputCls}
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
                className={inputCls}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                Carrera{isDual ? " 1" : ""} <span className="text-red-500">*</span>
              </label>
              <select
                value={form.career_id}
                onChange={(e) => setForm((p) => ({ ...p, career_id: e.target.value }))}
                className={inputCls}
              >
                <option value="">Selecciona una carrera</option>
                {careers.map((c) => (
                  <option key={c.career_id} value={c.career_id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>

            {/* Modality */}
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>Modalidad</label>
              <div className="flex gap-4">
                {[{ value: true, label: "Presencial" }, { value: false, label: "Virtual" }].map(({ value, label }) => (
                  <label key={label} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="is_on_campus"
                      checked={form.is_on_campus === value}
                      onChange={() => setForm((p) => ({ ...p, is_on_campus: value }))}
                      className="accent-blue-600"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Dual-degree checkbox */}
            <div className="sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={isDual}
                  onChange={(e) => {
                    setIsDual(e.target.checked)
                    if (!e.target.checked) setForm((p) => ({ ...p, career_id_2: "", primary_career: "1" }))
                  }}
                  className="h-4 w-4 rounded"
                />
                <GraduationCap size={15} className="text-amber-500" />
                <span className="text-sm font-semibold text-gray-700">Estudiante de doble titulación</span>
              </label>
            </div>

            {isDual && (
              <>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-semibold" style={{ color: BRAND }}>
                    Carrera 2 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.career_id_2}
                    onChange={(e) => setForm((p) => ({ ...p, career_id_2: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Selecciona la segunda carrera</option>
                    {careers
                      .filter((c) => c.career_id !== form.career_id)
                      .map((c) => (
                        <option key={c.career_id} value={c.career_id}>{c.name} ({c.code})</option>
                      ))}
                  </select>
                </div>

                <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-3 text-sm font-semibold text-amber-700 flex items-center gap-1.5">
                    <Star size={13} />
                    ¿Por cuál carrera votará primero?
                  </p>
                  <div className="space-y-2">
                    {[
                      { value: "1", career: careers.find((c) => c.career_id === form.career_id) },
                      { value: "2", career: careers.find((c) => c.career_id === form.career_id_2) },
                    ].map(({ value, career }) => (
                      <label key={value} className="flex cursor-pointer items-center gap-2.5">
                        <input
                          type="radio"
                          name="primary_career"
                          value={value}
                          checked={form.primary_career === value}
                          onChange={() => setForm((p) => ({ ...p, primary_career: value }))}
                          className="accent-amber-500"
                        />
                        <span className="text-sm text-gray-700">
                          {career ? (
                            <><span className="font-mono font-semibold text-amber-700">{career.code}</span> — {career.name}</>
                          ) : (
                            <span className="text-gray-400">Carrera {value} (selecciona arriba)</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <BtnSecondary onClick={() => { setShowForm(false); setIsDual(false) }}>Cancelar</BtnSecondary>
            <BtnPrimary loading={saving} onClick={handleCreate}>
              <Save size={15} />
              {isDual ? "Guardar (2 registros)" : "Guardar Cambios"}
            </BtnPrimary>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 && !showForm && !showImportPanel ? (
        <EmptyState
          icon={<Users size={30} style={{ color: ACCENT }} />}
          title="Aún no hay votantes registrados"
          description="Agrega votantes uno a uno o importa una lista en formato CSV."
          action={!isReadOnly ? {
            label: "Agregar Votante",
            onClick: () => { setShowForm(true); setError(null) },
            icon: <Plus size={15} />,
          } : undefined}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {voters.length > 0 && (
            <div className="border-b border-gray-100 px-5 py-3">
              <span className="text-xs text-gray-400">
                {filtered.length} de {voters.length} votante{voters.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Nombre</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">N° Cuenta</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Correo</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Carrera</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Modalidad</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase text-gray-400">Votó</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((v) => (
                  <tr key={v.election_voter_id} className="transition-colors hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">{v.voter?.full_name ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{v.voter?.institutional_id ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{v.voter?.email ?? "—"}</td>
                    <td className="px-5 py-3 text-gray-500">
                      <span>{v.career?.name ?? "—"}</span>
                      {dualVoterIds.has(v.voter_id) && (
                        <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs font-medium ${
                          v.is_primary !== false ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {v.is_primary !== false ? "Principal" : "Secundaria"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        v.voter?.is_on_campus !== false ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                      }`}>
                        {v.voter?.is_on_campus !== false ? "Presencial" : "Virtual"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {v.has_voted ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-600">Sí</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isReadOnly && (
                        <button
                          onClick={() => handleDelete(v.election_voter_id)}
                          aria-label={`Eliminar votante ${v.voter?.institutional_id ?? ""}`}
                          className="text-red-400 transition hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && voters.length > 0 && (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                      No hay resultados para la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
                Continuar a Revisión
                <ChevronRight size={16} />
              </BtnPrimary>
            </div>
          </>
        )}
      </WizardBottomBar>
    </>
  )
}
