import { useNavigate } from "react-router-dom"
import { VotingTimer } from "@/components/student/VotingTimer"
import { useVoting } from "@/context/VotingContext"
import type { Candidate } from "@/types/voting"

function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="h-52 w-full overflow-hidden bg-slate-100">
        {candidate.photoUrl ? (
          <img
            src={candidate.photoUrl}
            alt={candidate.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-medium text-[#1B2770]">{candidate.role}</p>
        <p className="mt-0.5 text-base font-bold text-gray-900">
          {candidate.name}
        </p>
      </div>
    </div>
  )
}

export default function StudentAssociationDetailPage() {
  const navigate = useNavigate()
  const { election, selectedAssociation, voteStartTime } = useVoting()

  if (
    !election ||
    !voteStartTime ||
    !selectedAssociation ||
    selectedAssociation === "blank"
  ) {
    navigate("/student/login")
    return null
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

      {/* Hero banner */}
      <div className="relative mx-6 overflow-hidden rounded-2xl bg-slate-200 shadow-sm">
        {selectedAssociation.photoUrl ? (
          <img
            src={selectedAssociation.photoUrl}
            alt={selectedAssociation.name}
            className="h-72 w-full object-cover"
          />
        ) : (
          <div className="flex h-72 w-full items-center justify-center bg-slate-200 text-slate-400">
            <svg
              width="80"
              height="80"
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
        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 pb-5 pt-12">
          <p className="text-xl font-bold text-white">
            {selectedAssociation.name}
          </p>
          <p className="text-sm text-white/80">
            {selectedAssociation.careerName}
          </p>
        </div>
      </div>

      {/* Candidates section */}
      <div className="mx-6 mt-8 pb-32">
        <h2 className="mb-1 text-2xl font-bold text-[#1B2770]">Candidatos</h2>
        <div className="mb-6 h-0.5 w-20 bg-[#1B2770]" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {selectedAssociation.candidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} />
          ))}
        </div>
      </div>

      {/* Sticky vote button */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#EDF0F5]/90 px-6 py-4 backdrop-blur-sm">
        <button
          onClick={() => navigate("/student/confirmar")}
          className="mx-auto block w-full max-w-sm rounded-lg bg-[#1B2770] py-4 text-base font-semibold text-white transition hover:bg-[#14205A]"
        >
          Votar
        </button>
      </div>
    </div>
  )
}
