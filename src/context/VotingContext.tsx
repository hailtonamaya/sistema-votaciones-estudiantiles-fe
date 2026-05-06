import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react"
import type { Association, Election, Student, VoteResult } from "@/types/voting"

interface VotingState {
  email: string | null
  token: string | null
  student: Student | null
  election: Election | null
  selectedAssociation: Association | "blank" | null
  voteStartTime: Date | null
  voteResult: VoteResult | null
}

interface VotingActions {
  setEmail: (email: string) => void
  setAuth: (token: string, student: Student) => void
  setElection: (election: Election) => void
  startVoting: () => void
  selectAssociation: (association: Association | "blank") => void
  setVoteResult: (result: VoteResult) => void
  reset: () => void
}

const initialState: VotingState = {
  email: null,
  token: null,
  student: null,
  election: null,
  selectedAssociation: null,
  voteStartTime: null,
  voteResult: null,
}

const VotingContext = createContext<(VotingState & VotingActions) | null>(null)

export function VotingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VotingState>(initialState)

  const actions: VotingActions = {
    setEmail: (email) => setState((s) => ({ ...s, email })),

    setAuth: (token, student) =>
      setState((s) => ({ ...s, token, student })),

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
