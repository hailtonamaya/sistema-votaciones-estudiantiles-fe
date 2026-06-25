import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { VotingTimer } from "@/components/student/VotingTimer"
import {
  AssociationCard,
  BlankVoteCard,
} from "@/components/student/AssociationCard"
import { UnitecLogo } from "@/components/UnitecLogo"
import { useVoting } from "@/context/VotingContext"
import { useAuth } from "@/context/AuthContext"
import { getStudentElection } from "@/services/voting.service"
import { BRAND } from "@/lib/brand"
import { CheckCircle2, ClockIcon } from "lucide-react"
import type { Association } from "@/types/voting"

export default function StudentVotingPage() {
  const navigate = useNavigate()
  const { election, voteStartTime, setElection, startVoting, selectAssociation } = useVoting()
  const { token } = useAuth()
  const [loadError, setLoadError] = useState("")
  const [loading, setLoading] = useState(false)
  const [alreadyVoted, setAlreadyVoted] = useState(false)

  useEffect(() => {
    if (election && voteStartTime) return

    if (!token) {
      navigate("/login", { replace: true })
      return
    }

    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    getStudentElection(token)
      .then((e) => {
        if (cancelled) return
        if (e.hasVoted) {
          setAlreadyVoted(true)
          return
        }
        setElection(e)
        startVoting()
      })
      .catch((err) => {
        if (cancelled) return
        setLoadError(
          err instanceof Error
            ? err.message
            : "No tienes ninguna elección activa habilitada para tu carrera.",
        )
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [election, voteStartTime, token, navigate, setElection, startVoting])

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-bg-light">
        <p className="text-sm text-gray-500">Cargando elección...</p>
      </main>
    )
  }

  if (alreadyVoted) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-bg-light px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="flex justify-center mb-5">
            <UnitecLogo size="lg" />
          </div>
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "#DCFCE7" }}
          >
            <CheckCircle2 size={26} style={{ color: "#16A34A" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: BRAND }}>
            Voto registrado
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Ya emitiste tu voto en esta elección. Solo se permite un voto por estudiante.
          </p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    )
  }

  if (loadError) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-bg-light px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="flex justify-center mb-5">
            <UnitecLogo size="lg" />
          </div>
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "#FEF9C3" }}
          >
            <ClockIcon size={26} style={{ color: "#A16207" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: BRAND }}>
            Sin elección activa
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            {loadError}
          </p>
          <p className="mt-4 text-xs text-gray-400">
            Cuando haya una elección disponible para tu carrera podrás acceder aquí.
          </p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Volver al inicio
          </button>
        </div>
      </main>
    )
  }

  if (!election || !voteStartTime) return null

  function handleSelect(association: Association | "blank") {
    selectAssociation(association)
    navigate(association === "blank" ? "/student/confirmar" : "/student/detalle")
  }

  return (
    <main className="min-h-dvh bg-bg-light">
      <div className="flex items-center justify-end px-6 py-4">
        <VotingTimer startTime={voteStartTime} />
      </div>

      <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6">
        <p className="mb-2 text-sm font-bold" style={{ color: BRAND }}>
          {election.title} / {election.careerName}
        </p>
        <p className="mb-8 text-sm text-gray-600">
          Elige la asociación por la que quieres votar.
        </p>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {election.associations.map((assoc) => (
            <AssociationCard
              key={assoc.id}
              association={assoc}
              onClick={() => handleSelect(assoc)}
            />
          ))}
          <BlankVoteCard onClick={() => handleSelect("blank")} />
        </div>
      </div>
    </main>
  )
}
