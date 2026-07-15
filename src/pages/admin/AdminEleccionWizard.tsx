import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, CheckCircle2, Lock, Loader2 } from "lucide-react"
import { AdminLayout } from "@/components/AdminLayout"
import { useAuth } from "@/context/AuthContext"
import { BRAND, ACCENT } from "@/lib/brand"
import { type ApiElection, listElections } from "@/services/admin.service"
import { Step1 } from "./wizard/Step1Detalles"
import { Step2 } from "./wizard/Step2Asociaciones"
import { Step3 } from "./wizard/Step3Candidatos"
import { Step4 } from "./wizard/Step4Votantes"
import { Step5 } from "./wizard/Step5Revision"

const STEP_TITLES: Record<number, string> = {
  1: "Detalles Generales",
  2: "Planillas",
  3: "Candidatos",
  4: "Votantes",
  5: "Revisión",
}

export default function AdminEleccionWizard() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const step = Math.max(1, Math.min(5, Number(searchParams.get("step")) || 1)) as
    | 1
    | 2
    | 3
    | 4
    | 5
  const electionId = searchParams.get("id") ?? null
  const isEditMode = searchParams.get("from") === "edit"

  const [election, setElection] = useState<ApiElection | null>(null)
  const [loadingElection, setLoadingElection] = useState(!!electionId)

  const isReadOnly = election?.status === "closed" || election?.status === "cancelled" || election?.status === "open"

  useEffect(() => {
    if (!electionId || !token || election) return
    listElections(token)
      .then((list) => setElection(list.find((e) => e.election_id === electionId) ?? null))
      .catch(() => {})
      .finally(() => setLoadingElection(false))
  }, [electionId, token, election])

  function goTo(s: number, id?: string) {
    const p: Record<string, string> = { step: String(s) }
    const eid = id ?? electionId
    if (eid) p.id = eid
    setSearchParams(p, { replace: true })
  }

  function handleExit() {
    if (isEditMode && electionId) {
      navigate(`/admin/elecciones/editar?id=${electionId}`)
    } else {
      navigate("/admin/elecciones/detalles")
    }
  }

  return (
    <AdminLayout>
      {/* Header: breadcrumb in edit mode, step indicator when creating */}
      {isEditMode ? (
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={handleExit}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50"
          >
            <ArrowLeft size={14} />
            Volver al resumen
          </button>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-semibold" style={{ color: BRAND }}>
            {STEP_TITLES[step]}
          </span>
          {election && (
            <>
              <span className="text-gray-300">·</span>
              <span className="truncate text-sm text-gray-400">{election.title}</span>
            </>
          )}
        </div>
      ) : (
        <div className="mb-6 overflow-x-auto">
          <div className="flex min-w-max items-center gap-2 pb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition"
                  style={{
                    backgroundColor: s === step ? BRAND : s < step ? ACCENT : "#E5E7EB",
                    color: s <= step ? "#fff" : "#9CA3AF",
                  }}
                >
                  {s < step ? <CheckCircle2 size={14} /> : s}
                </div>
                {s < 5 && (
                  <div
                    className="h-0.5 w-8 shrink-0 rounded"
                    style={{ backgroundColor: s < step ? ACCENT : "#E5E7EB" }}
                  />
                )}
              </div>
            ))}
            <span className="ml-3 shrink-0 text-sm font-medium text-gray-500">
              {STEP_TITLES[step]}
            </span>
          </div>
        </div>
      )}

      {isEditMode && isReadOnly && election && (
        election.status === "open" ? (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Lock size={15} className="shrink-0 text-amber-500" />
            Esta elección está <strong className="mx-1">activa</strong> — paúsala para poder editar su contenido.
          </div>
        ) : (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Lock size={15} className="shrink-0 text-slate-400" />
            Esta elección está <strong className="mx-1">{election.status === "closed" ? "finalizada" : "archivada"}</strong> — solo lectura.
          </div>
        )
      )}

      {loadingElection ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {step === 1 && (
            <Step1
              election={election}
              token={token!}
              isReadOnly={isReadOnly}
              onSaved={(e) => {
                setElection(e)
                if (isEditMode) handleExit()
                else goTo(2, e.election_id)
              }}
              onSaveAndExit={(e) => { setElection(e); handleExit() }}
              onCancel={handleExit}
            />
          )}
          {step === 2 && electionId && (
            <Step2
              electionId={electionId}
              token={token!}
              organizationId={election?.organization_id}
              isReadOnly={isReadOnly}
              onNext={() => goTo(3)}
              onBack={() => goTo(1)}
              onExit={handleExit}
            />
          )}
          {step === 3 && electionId && (
            <Step3
              electionId={electionId}
              token={token!}
              isReadOnly={isReadOnly}
              onNext={() => goTo(4)}
              onBack={() => goTo(2)}
              onExit={handleExit}
            />
          )}
          {step === 4 && electionId && (
            <Step4
              electionId={electionId}
              token={token!}
              isReadOnly={isReadOnly}
              onNext={() => goTo(5)}
              onBack={() => goTo(3)}
              onExit={handleExit}
            />
          )}
          {step === 5 && electionId && (
            <Step5
              election={election}
              electionId={electionId}
              token={token!}
              onBack={() => goTo(4)}
              onFinish={handleExit}
            />
          )}
        </>
      )}
    </AdminLayout>
  )
}
