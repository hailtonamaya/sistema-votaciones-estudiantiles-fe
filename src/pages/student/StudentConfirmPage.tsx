import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { VotingTimer } from "@/components/student/VotingTimer"
import { UnitecLogo } from "@/components/UnitecLogo"
import { useVoting } from "@/context/VotingContext"
import { useAuth } from "@/context/AuthContext"
import { castVote } from "@/services/voting.service"

export default function StudentConfirmPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { token } = useAuth()
  const {
    election,
    selectedAssociation,
    voteStartTime,
    setVoteResult,
  } = useVoting()

  if (!election || !selectedAssociation || !token || !voteStartTime) {
    navigate("/login")
    return null
  }

  const isBlank = selectedAssociation === "blank"
  const assocName = isBlank ? "Voto Blanco" : selectedAssociation.name
  const photoUrl = isBlank ? null : selectedAssociation.photoUrl

  async function handleConfirm() {
    setLoading(true)
    setError("")

    try {
      const elapsedSeconds = Math.floor(
        (Date.now() - voteStartTime!.getTime()) / 1000,
      )

      const result = await castVote(
        {
          electionId: election!.id,
          associationId: isBlank ? null : selectedAssociation !== "blank" ? selectedAssociation.id : null,
        },
        token!,
        election!.title,
        election!.careerName,
        assocName,
        elapsedSeconds,
      )

      setVoteResult(result)
      navigate("/student/exito")
    } catch {
      setError("No se pudo registrar el voto. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#EDF0F5]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate("/student/votar")}
          className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#1B2770] transition hover:bg-gray-50"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver al Inicio
        </button>
        <VotingTimer startTime={voteStartTime} />
      </div>

      {/* Content */}
      <div className="mx-auto max-w-2xl px-6 pb-12">
        {/* Association photo */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={assocName}
              className="h-80 w-full object-cover"
            />
          ) : isBlank ? (
            <div className="flex h-80 w-full items-center justify-center bg-gray-50">
              <UnitecLogo size="lg" />
            </div>
          ) : (
            <div className="flex h-80 w-full items-center justify-center bg-slate-200 text-slate-400">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
          )}
        </div>

        {/* Confirmation text */}
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-[#1B2770]">
            ¿Confirmar Voto?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-gray-600">
            {isBlank
              ? "Estás a punto de registrar tu voto en blanco."
              : `Estás a punto de registrar tu voto por ${selectedAssociation.name} de la carrera de ${election.careerName}.`}
          </p>
        </div>

        {error && (
          <p className="mt-4 text-center text-sm text-red-500">{error}</p>
        )}

        {/* Action buttons */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="rounded-lg bg-[#1B2770] py-4 text-sm font-semibold text-white transition hover:bg-[#14205A] disabled:opacity-50"
          >
            {loading ? "Registrando..." : "Sí, confirmar voto"}
          </button>
          <button
            onClick={() => navigate("/student/votar")}
            disabled={loading}
            className="rounded-lg border border-[#1B2770] py-4 text-sm font-semibold text-[#1B2770] transition hover:bg-[#1B2770]/5 disabled:opacity-50"
          >
            No, cambiar selección
          </button>
        </div>
      </div>
    </div>
  )
}
