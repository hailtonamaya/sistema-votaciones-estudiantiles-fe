import type { Association } from "@/types/voting"
import { UnitecLogo } from "@/components/UnitecLogo"

interface AssociationCardProps {
  association: Association
  onClick: () => void
}

interface BlankVoteCardProps {
  onClick: () => void
}

export function AssociationCard({ association, onClick }: AssociationCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1B2770]/40"
    >
      <div className="h-48 w-full overflow-hidden bg-gray-100">
        {association.photoUrl ? (
          <img
            src={association.photoUrl}
            alt={association.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-400">
            <svg
              width="48"
              height="48"
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
      <div className="p-4">
        <p className="font-bold text-[#1B2770]">{association.name}</p>
        <p className="mt-0.5 text-sm text-gray-500">{association.careerName}</p>
      </div>
    </button>
  )
}

export function BlankVoteCard({ onClick }: BlankVoteCardProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#1B2770]/40"
    >
      <div className="flex h-48 w-full items-center justify-center bg-gray-50">
        <UnitecLogo size="md" />
      </div>
      <div className="p-4">
        <p className="font-bold text-[#1B2770]">Registrar Voto Blanco</p>
      </div>
    </button>
  )
}
