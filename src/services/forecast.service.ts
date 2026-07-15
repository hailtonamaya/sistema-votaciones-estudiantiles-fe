import { api } from "@/lib/api"

export interface TurnoutForecast {
  finalTurnout: number
  low: number
  high: number
}

export interface ProjectedAssociation {
  associationId: string
  name: string
  currentVotes: number
  currentShare: number
  winProbability: number
}

export interface ProjectionBand {
  associationId: string
  name: string
  currentVotes: number
  projectedVotesLow: number
  projectedVotesHigh: number
}

export interface ForecastResult {
  modelName: string
  hasEnoughData: boolean
  decided: boolean
  projectedWinner: ProjectedAssociation | null
  runnerUp: ProjectedAssociation | null
  margin: number
  winProbability: number
  confidenceLabel: string
  remainingVoters: number
  projection: ProjectionBand[]
  turnoutForecast: TurnoutForecast | null
  method: string
}

export interface CalibrationBin {
  binLow: number
  binHigh: number
  count: number
  meanPredicted: number
  observedFrequency: number
}

export interface BacktestModelResult {
  modelName: string
  snapshotsEvaluated: number
  correctWinnerAtEnd: boolean
  decisionTurnoutFraction: number | null
  brierScore: number
  expectedCalibrationError: number
  calibration: CalibrationBin[]
  projectionMae: number
  projectionRmse: number
}

export interface BacktestReport {
  electionId: string
  finalWinner: { associationId: string; name: string; votes: number } | null
  totalSnapshots: number
  models: BacktestModelResult[]
}

export interface CompareResponse {
  models: ForecastResult[]
  available: string[]
}

export const FORECAST_MODEL_LABELS: Record<string, string> = {
  "finite-population": "Población finita",
  "bayesian-dirichlet": "Bayesiano Dirichlet",
  "timeseries-turnout": "Serie temporal",
}

export function modelLabel(name: string): string {
  return FORECAST_MODEL_LABELS[name] ?? name
}

export async function getForecast(
  electionId: string,
  token: string,
  model?: string
): Promise<ForecastResult> {
  const qs = model ? `?model=${encodeURIComponent(model)}` : ""
  const res = await api<{ data: ForecastResult }>(
    `/forecast/elections/${electionId}${qs}`,
    { token }
  )
  return res.data
}

export async function compareModels(
  electionId: string,
  token: string
): Promise<CompareResponse> {
  const res = await api<{ data: CompareResponse }>(
    `/forecast/elections/${electionId}/compare`,
    { token }
  )
  return res.data
}

export async function getBacktest(
  electionId: string,
  token: string
): Promise<BacktestReport> {
  const res = await api<{ data: BacktestReport }>(
    `/forecast/elections/${electionId}/backtest`,
    { token }
  )
  return res.data
}

export async function captureSnapshot(
  electionId: string,
  token: string
): Promise<void> {
  await api(`/forecast/elections/${electionId}/snapshot`, {
    method: "POST",
    token,
  })
}
