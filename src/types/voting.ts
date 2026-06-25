export interface Candidate {
  id: string
  name: string
  role: string
  photoUrl: string | null
}

export interface Association {
  id: string
  name: string
  careerId: string
  careerName: string
  photoUrl: string | null
  candidates: Candidate[]
}

export interface Election {
  id: string
  title: string
  careerId: string
  careerName: string
  associations: Association[]
  hasVoted: boolean
}

export interface VotePayload {
  electionId: string
  associationId: string | null // null = voto blanco
  careerId: string
}

export interface VoteResult {
  electionTitle: string
  careerName: string
  associationName: string
  votingTimeSeconds: number
}
