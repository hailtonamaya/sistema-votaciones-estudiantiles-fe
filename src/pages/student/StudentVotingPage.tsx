import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { VotingTimer } from "@/components/student/VotingTimer"
import {
  AssociationCard,
  BlankVoteCard,
} from "@/components/student/AssociationCard"
import { useVoting } from "@/context/VotingContext"
import { useAuth } from "@/context/AuthContext"
import { getStudentElection } from "@/services/voting.service"
import type { Association } from "@/types/voting"

export default function StudentVotingPage() {
  const navigate = useNavigate()
  const { election, voteStartTime, setElection, startVoting, selectAssociation } = useVoting()
  const { token } = useAuth()
  const [loadError, setLoadError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (election && voteStartTime) return

    if (!token) {
      navigate("/login", { replace: true })
      return
    }

    setLoading(true)
    getStudentElection(token)
      .then((e) => {
        setElection(e)
        startVoting()
      })
      .catch((err) => {
        setLoadError(
          err instanceof Error
            ? err.message
            : "No tienes ninguna elección activa habilitada para tu carrera.",
        )
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EDF0F5]">
        <p className="text-sm text-gray-500">Cargando elección...</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#EDF0F5] px-4">
        <p className="text-center text-sm text-red-500">{loadError}</p>
      </div>
    )
  }

  if (!election || !voteStartTime) return null

  function handleSelect(association: Association | "blank") {
    selectAssociation(association)
    navigate(association === "blank" ? "/student/confirmar" : "/student/detalle")
  }

  return (
    <div className="min-h-screen bg-[#EDF0F5]">
      {/* Top bar */}
      <div className="flex items-center justify-end px-6 py-4">
        <VotingTimer startTime={voteStartTime} />
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-12">
        {/* Breadcrumb */}
        <p className="mb-2 text-sm font-bold text-[#1B2770]">
          {election.title} / {election.careerName}
        </p>
        <p className="mb-8 text-sm text-gray-600">
          Elige la asociación por la que quieres votar.
        </p>

        {/* Association grid */}
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
    </div>
  )
}
