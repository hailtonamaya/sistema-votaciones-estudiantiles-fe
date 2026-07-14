import { useState } from "react"
import { ArrowLeft, CheckCircle2, Users, X } from "lucide-react"
import { AssociationCard, BlankVoteCard } from "@/components/student/AssociationCard"
import { UnitecLogo } from "@/components/UnitecLogo"
import type { Association, Candidate } from "@/types/voting"
import { BRAND, ACCENT } from "@/lib/brand"

// ─── Candidate card ───────────────────────────────────────────────────────────

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="h-48 w-full overflow-hidden bg-slate-100">
        {candidate.photoUrl ? (
          <img
            src={candidate.photoUrl}
            alt={candidate.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <svg aria-hidden focusable="false" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium" style={{ color: BRAND }}>{candidate.role}</p>
        <p className="mt-0.5 text-base font-bold text-gray-900">{candidate.name}</p>
      </div>
    </div>
  )
}

// ─── Simulation modal ─────────────────────────────────────────────────────────

type SimStep = "list" | "detail" | "confirm" | "success"

interface SimulationModalProps {
  electionTitle: string
  careerName: string
  associations: Association[]
  onClose: () => void
}

export function SimulationModal({
  electionTitle,
  careerName,
  associations,
  onClose,
}: SimulationModalProps) {
  const [step, setStep] = useState<SimStep>("list")
  const [selected, setSelected] = useState<Association | "blank" | null>(null)

  function selectAssociation(assoc: Association | "blank") {
    setSelected(assoc)
    setStep(assoc === "blank" ? "confirm" : "detail")
  }

  const isBlank = selected === "blank"
  const assocName = !selected || isBlank ? "Voto en Blanco" : selected.name
  const photoUrl = !selected || isBlank ? null : (selected as Association).photoUrl

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-bg-light">
      {/* Banner */}
      <div
        className="flex shrink-0 items-center justify-between gap-3 px-4 py-2.5 text-white"
        style={{ backgroundColor: BRAND }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex shrink-0 items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest">
            MODO SIMULACIÓN
          </span>
          <span className="hidden truncate text-sm text-white/80 sm:block">
            {electionTitle} · {careerName}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {(["list", "detail", "confirm", "success"] as SimStep[]).map((s, i) => (
            <span
              key={s}
              className="h-2 w-2 rounded-full transition-all"
              style={{
                backgroundColor:
                  s === step ? "#ffffff" :
                  (["list", "detail", "confirm", "success"].indexOf(step) > i)
                    ? "rgba(255,255,255,0.5)"
                    : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>

        <button
          onClick={onClose}
          aria-label="Cerrar simulación"
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/30 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/10"
        >
          <X size={14} />
          Cerrar
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* LIST */}
        {step === "list" && (
          <main className="bg-bg-light">
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
              <p className="mb-1 text-sm font-bold" style={{ color: BRAND }}>
                {electionTitle} / {careerName}
              </p>
              <p className="mb-8 text-sm text-gray-600">
                Elige la asociación por la que quieres votar.
              </p>
              {associations.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 text-center shadow-sm">
                  <Users size={40} className="mb-4 text-gray-200" />
                  <p className="font-semibold text-gray-400">Sin planillas registradas para esta carrera</p>
                  <p className="mt-1 text-sm text-gray-300">
                    Agrega planillas en la sección Asociaciones y vuelve a simular.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {associations.map((assoc) => (
                    <AssociationCard key={assoc.id} association={assoc} onClick={() => selectAssociation(assoc)} />
                  ))}
                  <BlankVoteCard onClick={() => selectAssociation("blank")} />
                </div>
              )}
            </div>
          </main>
        )}

        {/* DETAIL */}
        {step === "detail" && selected && !isBlank && (
          <main className="min-h-full bg-bg-light">
            <div className="flex items-center justify-between px-6 py-4">
              <button
                onClick={() => setStep("list")}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
                style={{ color: BRAND }}
              >
                <ArrowLeft size={15} />
                Volver al Inicio
              </button>
            </div>

            <div className="relative mx-4 overflow-hidden rounded-2xl bg-slate-200 shadow-sm sm:mx-6">
              {(selected as Association).photoUrl ? (
                <img
                  src={(selected as Association).photoUrl!}
                  alt={(selected as Association).name}
                  loading="lazy"
                  decoding="async"
                  className="h-48 w-full object-cover sm:h-72"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-slate-200 text-slate-400 sm:h-72">
                  <svg aria-hidden focusable="false" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 pb-5 pt-12">
                <p className="text-xl font-bold text-white">{(selected as Association).name}</p>
                <p className="text-sm text-white/80">{careerName}</p>
              </div>
            </div>

            <div className="mx-4 mt-6 pb-32 sm:mx-6 sm:mt-8">
              <h2 className="mb-1 text-2xl font-bold" style={{ color: BRAND }}>Candidatos</h2>
              <div className="mb-6 h-0.5 w-20" style={{ backgroundColor: BRAND }} />
              {(selected as Association).candidates.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-12 text-center">
                  <p className="text-sm text-gray-400">Sin candidatos registrados para esta planilla</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {(selected as Association).candidates.map((c) => (
                    <CandidateCard key={c.id} candidate={c} />
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-bg-light/90 px-6 py-4 backdrop-blur-sm">
              <button
                onClick={() => setStep("confirm")}
                className="mx-auto block w-full max-w-sm rounded-lg py-4 text-base font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                Votar por esta planilla
              </button>
            </div>
          </main>
        )}

        {/* CONFIRM */}
        {step === "confirm" && selected && (
          <main className="min-h-full bg-bg-light">
            <div className="flex items-center px-6 py-4">
              <button
                onClick={() => setStep("list")}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
                style={{ color: BRAND }}
              >
                <ArrowLeft size={15} />
                Volver al Inicio
              </button>
            </div>
            <div className="mx-auto max-w-2xl px-4 pb-12 sm:px-6">
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                {photoUrl ? (
                  <img src={photoUrl} alt={assocName} className="h-52 w-full object-cover sm:h-80" />
                ) : isBlank ? (
                  <div className="flex h-52 w-full items-center justify-center bg-gray-50 sm:h-80">
                    <UnitecLogo size="lg" />
                  </div>
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-slate-200 text-slate-400 sm:h-80">
                    <svg aria-hidden focusable="false" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="mt-8 text-center">
                <h2 className="text-2xl font-bold" style={{ color: BRAND }}>¿Confirmar Voto?</h2>
                <p className="mx-auto mt-4 max-w-md text-base text-gray-600">
                  {isBlank
                    ? "Estás a punto de registrar tu voto en blanco."
                    : `Estás a punto de registrar tu voto por ${assocName} de la carrera de ${careerName}.`}
                </p>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <button
                  onClick={() => setStep("success")}
                  className="rounded-lg py-4 text-sm font-semibold text-white transition hover:opacity-90"
                  style={{ backgroundColor: BRAND }}
                >
                  Sí, confirmar voto
                </button>
                <button
                  onClick={() => { setSelected(null); setStep("list") }}
                  className="rounded-lg border py-4 text-sm font-semibold transition hover:bg-gray-50"
                  style={{ borderColor: BRAND, color: BRAND }}
                >
                  No, cambiar selección
                </button>
              </div>
            </div>
          </main>
        )}

        {/* SUCCESS */}
        {step === "success" && (
          <main className="flex min-h-full items-center justify-center bg-bg-light px-4 py-16">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm sm:p-10">
              <div className="flex justify-center">
                <UnitecLogo size="lg" />
              </div>
              <div
                className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: "#DCFCE7" }}
              >
                <CheckCircle2 size={32} className="text-green-600" />
              </div>
              <h1 className="mt-6 text-center text-2xl font-bold" style={{ color: BRAND }}>
                ¡Voto Registrado!
              </h1>
              <p className="mt-2 text-center text-sm text-gray-400">
                (Solo simulación — no se registró ningún voto real)
              </p>
              <div className="mt-6 space-y-1.5 rounded-xl bg-gray-50 p-4 text-sm" style={{ color: BRAND }}>
                <p className="font-semibold">Resumen de votación</p>
                <p>Elección: {electionTitle}</p>
                <p>Carrera: {careerName}</p>
                <p>Asociación: {assocName}</p>
              </div>
              <button
                onClick={onClose}
                className="mt-8 w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: BRAND }}
              >
                Cerrar Simulación
              </button>
              <button
                onClick={() => { setStep("list"); setSelected(null) }}
                className="mt-3 w-full rounded-lg border py-3 text-sm font-semibold transition hover:bg-gray-50"
                style={{ borderColor: BRAND, color: BRAND }}
              >
                Volver al inicio de la simulación
              </button>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}

// Re-export ACCENT so callers don't need to import separately
export { ACCENT }
