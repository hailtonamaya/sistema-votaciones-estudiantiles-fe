import { api } from "@/lib/api"

export interface ElectionSummary {
  election_id: string
  organization_id: string
  title: string
  description: string | null
  status: "draft" | "scheduled" | "open" | "closed" | "cancelled"
  start_at: string | null
  end_at: string | null
  created_at: string
}

export interface CareerBreakdown {
  career_id: string
  career_name: string
  career_code: string
  eligible: number
  voted: number
  turnout: number
}

export interface AssociationTally {
  association_id: string
  name: string
  career_id: string | null
  career_name: string | null
  votes: number
  share: number
}

export interface HourlyPoint {
  hour: string
  label: string
  count: number
  cumulative: number
}

export interface DashboardData {
  election: {
    election_id: string
    title: string
    status: string
    start_at: string | null
    end_at: string | null
  }
  totals: {
    eligible: number
    voted: number
    pending: number
    turnout: number
    valid_votes: number
    blank_votes: number
  }
  by_career: CareerBreakdown[]
  by_association: AssociationTally[]
  turnout_by_hour: HourlyPoint[]
}

export interface Prediction {
  has_enough_data: boolean
  decided: boolean
  projected_winner: {
    association_id: string
    name: string
    current_votes: number
    current_share: number
    win_probability: number
  } | null
  runner_up: {
    association_id: string
    name: string
    current_votes: number
    current_share: number
  } | null
  margin: number
  confidence_label: string
  remaining_voters: number
  projection: Array<{
    association_id: string
    name: string
    current_votes: number
    projected_votes_low: number
    projected_votes_high: number
  }>
  anomalies: Array<{
    hour: string
    label: string
    count: number
    z_score: number
    note: string
  }>
  method: string
}

export interface Insights {
  summary: string
  provider: string
  model: string
  dashboard: DashboardData
  prediction: Prediction
}

export async function getElections(
  token: string,
  status?: ElectionSummary["status"],
): Promise<ElectionSummary[]> {
  const qs = status ? `?status=${status}` : ""
  const res = await api<{ data: ElectionSummary[] }>(`/elections${qs}`, { token })
  return res.data
}

export async function getDashboard(
  electionId: string,
  token: string,
): Promise<DashboardData> {
  const res = await api<{ data: DashboardData }>(
    `/results/elections/${electionId}/dashboard`,
    { token },
  )
  return res.data
}

export async function getPrediction(
  electionId: string,
  token: string,
): Promise<Prediction> {
  const res = await api<{ data: Prediction }>(
    `/results/elections/${electionId}/prediction`,
    { token },
  )
  return res.data
}

export async function getInsights(
  electionId: string,
  token: string,
): Promise<Insights> {
  const res = await api<{ data: Insights }>(
    `/ai/elections/${electionId}/insights`,
    { token },
  )
  return res.data
}
