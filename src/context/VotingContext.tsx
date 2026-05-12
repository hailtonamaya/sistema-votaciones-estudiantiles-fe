import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"
import type { Association, Election, VoteResult } from "@/types/voting"

interface VotingState {
  election: Election | null
  selectedAssociation: Association | "blank" | null
  voteStartTime: Date | null
  voteResult: VoteResult | null
}

interface VotingActions {
  setElection: (election: Election) => void
  startVoting: () => void
  selectAssociation: (association: Association | "blank") => void
  setVoteResult: (result: VoteResult) => void
  reset: () => void
}

const initialState: VotingState = {
  election: null,
  selectedAssociation: null,
  voteStartTime: null,
  voteResult: null,
}

const VotingContext = createContext<(VotingState & VotingActions) | null>(null)

export function VotingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VotingState>(initialState)

  const actions: VotingActions = {
    setElection: (election) => setState((s) => ({ ...s, election })),

    startVoting: () =>
      setState((s) => ({ ...s, voteStartTime: new Date() })),

    selectAssociation: (association) =>
      setState((s) => ({ ...s, selectedAssociation: association })),

    setVoteResult: (voteResult) =>
      setState((s) => ({ ...s, voteResult })),

    reset: () => setState(initialState),
  }

  return (
    <VotingContext.Provider value={{ ...state, ...actions }}>
      {children}
    </VotingContext.Provider>
  )
}

export function useVoting() {
  const ctx = useContext(VotingContext)
  if (!ctx) throw new Error("useVoting must be used within VotingProvider")
  return ctx
}
