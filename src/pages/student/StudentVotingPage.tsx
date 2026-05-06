import { useNavigate } from "react-router-dom"
import { VotingTimer } from "@/components/student/VotingTimer"
import {
  AssociationCard,
  BlankVoteCard,
} from "@/components/student/AssociationCard"
import { useVoting } from "@/context/VotingContext"
import type { Association } from "@/types/voting"

export default function StudentVotingPage() {
  const navigate = useNavigate()
  const { election, voteStartTime, selectAssociation } = useVoting()

  if (!election || !voteStartTime) {
    navigate("/student/login")
    return null
  }

  function handleSelect(association: Association | "blank") {
    selectAssociation(association)
    // Blank vote skips the detail page — goes straight to confirmation
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
