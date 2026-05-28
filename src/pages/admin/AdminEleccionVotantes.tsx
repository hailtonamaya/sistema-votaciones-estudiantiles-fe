import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiCareer,
  type ApiElection,
  type ApiVoter,
  type ImportVoterRow,
  type ImportVotersResult,
  createVoter,
  deleteVoter,
  importVoters,
  listCareers,
  listElections,
  listVoters,
} from "@/services/admin.service"
import {
  CheckCircle2,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react"
import { ErrorBanner } from "@/components/ErrorBanner"

const BRAND = "#06065C"
const ACCENT = "#03AED2"

function parseCSV(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.split(",").map((c) => c.trim()))
    .filter((row) => row.some((c) => c !== ""))
}

export default function AdminEleccionVotantes() {
  const { token } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const fileRef = useRef<HTMLInputElement>(null)

  const [elections, setElections] = useState<ApiElection[]>([])
  const [careers, setCareers] = useState<ApiCareer[]>([])
  const [voters, setVoters] = useState<ApiVoter[]>([])
  const [loadingElections, setLoadingElections] = useState(true)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ full_name: "", institutional_id: "", email: "", career_id: "" })

  // CSV import state
  const [importRows, setImportRows] = useState<ImportVoterRow[] | null>(null)
  const [importParseErrors, setImportParseErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportVotersResult | null>(null)

  const selectedId = searchParams.get("election_id") ?? ""

  useEffect(() => {
    Promise.all([listElections(token!), listCareers(token!)])
      .then(([el, ca]) => { setElections(el); setCareers(ca) })
      .catch(() => {})
      .finally(() => setLoadingElections(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedId) { setVoters([]); return }
    setLoading(true)
    listVoters(token!, selectedId)
      .then(setVoters)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedId, token])
  /* eslint-enable react-hooks/set-state-in-effect */

  function selectElection(id: string) {
    setSearchParams(id ? { election_id: id } : {}, { replace: true })
    setShowForm(false)
    setError(null)
    setImportRows(null)
    setImportResult(null)
  }

  function getVoterName(v: ApiVoter) { return v.voter?.full_name ?? "—" }
  function getVoterEmail(v: ApiVoter) { return v.voter?.email ?? "—" }
  function getVoterAccount(v: ApiVoter) { return v.voter?.institutional_id ?? "—" }
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
        return
      }

      const [, ...dataRows] = lines // skip header row
      const errs: string[] = []
      const rows: ImportVoterRow[] = []

      dataRows.forEach((cols, i) => {
        const [institutional_id, full_name, email, career_code] = cols
        if (!institutional_id || !full_name || !email || !career_code) {
          errs.push(`Fila ${i + 2}: faltan columnas (se esperan: numero_cuenta, nombre_completo, correo, codigo_carrera)`)
          return
        }
        const career = careers.find(
          (c) => c.code.toLowerCase() === career_code.toLowerCase(),
        )
        if (!career) {
          errs.push(`Fila ${i + 2}: código de carrera desconocido "${career_code}"`)
          return
        }
        rows.push({ institutional_id, full_name, email, career_id: career.career_id })
      })

      setImportParseErrors(errs)
      setImportRows(rows.length > 0 ? rows : null)
      setImportResult(null)
    }
    reader.readAsText(file)
  }

  async function handleImportConfirm() {
    if (!importRows?.length) return
    setImporting(true)
    try {
      const result = await importVoters(token!, selectedId, importRows)
      setImportResult(result)
      setImportRows(null)
      // Reload voter list after import
      const updated = await listVoters(token!, selectedId)
      setVoters(updated)
    } catch (e) {
      setImportParseErrors([e instanceof Error ? e.message : "Error al importar"])
    } finally {
      setImporting(false)
    }
  }

  const filtered = voters.filter((v) =>
    getVoterName(v).toLowerCase().includes(search.toLowerCase()) ||
    getVoterEmail(v).toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Crear Votantes</h1>
        <p className="mt-0.5 text-sm text-gray-500">Registra los estudiantes habilitados para votar.</p>
      </div>

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
                <option key={e.election_id} value={e.election_id}>{e.title}</option>
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
          <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>Selecciona una elección</p>
          <p className="max-w-sm text-sm text-gray-500">
            Elige una elección en el selector de arriba para ver y gestionar sus votantes.
          </p>
        </div>
      ) : (
        <>
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

            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => { setImportResult(null); setImportParseErrors([]); fileRef.current?.click() }}
              className="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:opacity-80"
              style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: "transparent" }}
            >
              <Upload size={15} />
              Importar CSV
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

          {/* CSV import preview panel */}
          {(importRows !== null || importParseErrors.length > 0) && (
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold" style={{ color: BRAND }}>
                  Importar votantes desde CSV
                </h3>
                <button onClick={() => { setImportRows(null); setImportParseErrors([]) }}>
                  <X size={18} className="text-gray-400 hover:text-gray-600" />
                </button>
              </div>

              <p className="mb-3 text-xs text-gray-400">
                Formato esperado (sin encabezado alternativo):{" "}
                <code className="rounded bg-gray-100 px-1 py-0.5">numero_cuenta,nombre_completo,correo,codigo_carrera</code>
              </p>

              {importParseErrors.length > 0 && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-xs font-semibold text-red-600">Errores de validación:</p>
                  <ul className="list-inside list-disc space-y-0.5 text-xs text-red-500">
                    {importParseErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {importRows && importRows.length > 0 && (
                <>
                  <p className="mb-4 text-sm text-gray-600">
                    <span className="font-semibold text-gray-800">{importRows.length}</span> votante{importRows.length !== 1 ? "s" : ""} listos para importar.
                    Los que ya existan en esta elección serán omitidos sin error.
                  </p>
                  <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr>
                          {["N° Cuenta", "Nombre", "Correo", "Carrera"].map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {importRows.map((r, i) => (
                          <tr key={i}>
                            <td className="px-3 py-1.5 text-gray-700">{r.institutional_id}</td>
                            <td className="px-3 py-1.5 text-gray-700">{r.full_name}</td>
                            <td className="px-3 py-1.5 text-gray-500">{r.email}</td>
                            <td className="px-3 py-1.5 text-gray-500">
                              {careers.find((c) => c.career_id === r.career_id)?.code ?? r.career_id}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleImportConfirm}
                      disabled={importing}
                      className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: BRAND }}
                    >
                      {importing ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                      {importing ? "Importando…" : "Confirmar importación"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Import result banner */}
          {importResult && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4">
              <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0 text-green-500" />
              <div className="text-sm">
                <p className="font-semibold text-green-700">
                  Importación completada: {importResult.created} creado{importResult.created !== 1 ? "s" : ""},{" "}
                  {importResult.skipped} omitido{importResult.skipped !== 1 ? "s" : ""}
                  {importResult.errors.length > 0 && `, ${importResult.errors.length} con error`}.
                </p>
                {importResult.errors.length > 0 && (
                  <ul className="mt-1 list-inside list-disc text-xs text-red-500">
                    {importResult.errors.map((err, i) => (
                      <li key={i}>{err.row.institutional_id}: {err.error}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button onClick={() => setImportResult(null)} className="ml-auto text-green-400 hover:text-green-600">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Add form panel */}
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
                <button
                  onClick={() => setShowForm(false)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: BRAND }}
                >
                  {saving && <Loader2 size={15} className="animate-spin" />}
                  <Save size={15} />
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}

          {/* Voters table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-gray-400" />
            </div>
          ) : filtered.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 px-8 shadow-sm text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <Users size={30} style={{ color: ACCENT }} />
              </div>
              <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>Aún no hay votantes registrados</p>
              <p className="mb-6 max-w-sm text-sm text-gray-500">
                Registra los estudiantes habilitados para participar en esta elección.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => { fileRef.current?.click() }}
                  className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition hover:opacity-80"
                  style={{ borderColor: ACCENT, color: ACCENT }}
                >
                  <Upload size={15} />
                  Importar CSV
                </button>
                <button
                  onClick={() => { setShowForm(true); setError(null) }}
                  className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                  style={{ backgroundColor: BRAND }}
                >
                  <Plus size={15} />
                  Agregar Votante
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
              <table className="w-full min-w-[600px] text-sm">
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
        </>
      )}
    </AdminLayout>
  )
}
