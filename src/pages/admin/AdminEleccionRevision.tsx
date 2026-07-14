import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import {
  type ApiElection,
  type ApiOrganization,
  getElection,
  listElections,
  listOrganizations,
} from "@/services/admin.service"
import { Lock, Loader2, ClipboardList } from "lucide-react"
import { BRAND, ACCENT } from "@/lib/brand"
import { Step5 } from "./wizard/Step5Revision"

export default function AdminEleccionRevision() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [elections, setElections] = useState<ApiElection[]>([])
  const [organizations, setOrganizations] = useState<ApiOrganization[]>([])
  const [selectedOrg, setSelectedOrg] = useState("")
  const [selectedElection, setSelectedElection] = useState<ApiElection | null>(null)
  const [loadingElections, setLoadingElections] = useState(true)
  const [loadingElection, setLoadingElection] = useState(false)

  const selectedId = searchParams.get("election_id") ?? ""

  useEffect(() => {
    Promise.all([listElections(token!), listOrganizations(token!)])
      .then(([el, orgs]) => { setElections(el); setOrganizations(orgs) })
      .catch(() => {})
      .finally(() => setLoadingElections(false))
  }, [token])

  useEffect(() => {
    
    if (!selectedId || !token) { setSelectedElection(null); return }
    setLoadingElection(true)
    getElection(token, selectedId)
      .then(setSelectedElection)
      .catch(() => {})
      .finally(() => setLoadingElection(false))
  }, [selectedId, token])

  function selectElection(id: string) {
    setSearchParams(id ? { election_id: id } : {}, { replace: true })
  }

  const filteredElections = selectedOrg
    ? elections.filter((e) => e.organization_id === selectedOrg)
    : elections

  const goToElection = () => navigate(`/admin/elecciones/editar?id=${selectedId}`)
  const goToPrev = () => navigate(`/admin/elecciones/votantes?election_id=${selectedId}`)

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: BRAND }}>Revisión</h1>
        <p className="mt-0.5 text-sm text-gray-500">Revisa y valida la configuración antes de activar la elección.</p>
      </div>

      {/* Election selector */}
      <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
        {loadingElections ? (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Loader2 size={15} className="animate-spin" /> Cargando elecciones…
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold whitespace-nowrap" style={{ color: BRAND }}>Campus:</label>
              <select
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
              >
                <option value="">Todos</option>
                {organizations.map((o) => (
                  <option key={o.organization_id} value={o.organization_id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 items-center gap-2">
              <label className="text-sm font-semibold whitespace-nowrap" style={{ color: BRAND }}>Elección:</label>
              <select
                value={selectedId}
                onChange={(e) => selectElection(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-400"
              >
                <option value="">Selecciona una elección</option>
                {filteredElections.map((e) => (
                  <option key={e.election_id} value={e.election_id}>{e.title}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {!selectedId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 px-8 shadow-sm text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
            <ClipboardList size={30} style={{ color: ACCENT }} />
          </div>
          <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>Selecciona una elección</p>
          <p className="max-w-sm text-sm text-gray-500">
            Elige una elección en el selector de arriba para revisar su configuración.
          </p>
        </div>
      ) : loadingElection ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* Status banners */}
          {selectedElection?.status === "open" && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <Lock size={15} className="shrink-0 text-amber-500" />
              Esta elección está <strong className="mx-1">activa</strong> — paúsala para poder realizar cambios.
            </div>
          )}
          {(selectedElection?.status === "closed" || selectedElection?.status === "cancelled") && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <Lock size={15} className="shrink-0 text-slate-400" />
              Esta elección está <strong className="mx-1">{selectedElection.status === "closed" ? "finalizada" : "archivada"}</strong> — solo lectura.
            </div>
          )}

          <Step5
            election={selectedElection}
            electionId={selectedId}
            token={token!}
            hideHeader
            onBack={goToPrev}
            onFinish={goToElection}
          />
        </>
      )}
    </AdminLayout>
  )
}
