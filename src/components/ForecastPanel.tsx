import { useCallback, useEffect, useState } from "react"
import { BRAND, ACCENT } from "@/lib/brand"
import { formatPercent, toPercent } from "@/lib/elections"
import {
  captureSnapshot,
  compareModels,
  getBacktest,
  modelLabel,
  type BacktestReport,
  type CompareResponse,
  type ForecastResult,
} from "@/services/forecast.service"
import {
  Activity,
  AlertTriangle,
  Camera,
  FlaskConical,
  Loader2,
  Scale,
  TrendingUp,
  Trophy,
} from "lucide-react"

const MODEL_COLORS: Record<string, string> = {
  "finite-population": "#1D4ED8",
  "bayesian-dirichlet": "#7C3AED",
  "timeseries-turnout": "#059669",
}

function modelColor(name: string): string {
  return MODEL_COLORS[name] ?? ACCENT
}

function SectionHeader({
  title,
  subtitle,
  icon,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <p className="text-sm font-semibold" style={{ color: BRAND }}>
          {title}
        </p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-xl bg-bg-light"
        style={{ color: BRAND }}
      >
        {icon}
      </div>
    </div>
  )
}

function CalibrationChart({ report }: { report: BacktestReport }) {
  const W = 380
  const H = 240
  const PAD = { top: 12, right: 12, bottom: 34, left: 40 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const x = (v: number) => PAD.left + v * chartW
  const y = (v: number) => PAD.top + (1 - v) * chartH

  const series = report.models
    .map((m) => ({
      name: m.modelName,
      color: modelColor(m.modelName),
      pts: m.calibration.filter((b) => b.count > 0),
    }))
    .filter((s) => s.pts.length > 0)

  if (!series.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50">
        <p className="text-sm text-gray-400">
          Sin datos suficientes para la curva de calibración
        </p>
      </div>
    )
  }

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line
              x1={x(0)}
              y1={y(f)}
              x2={x(1)}
              y2={y(f)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4"
            />
            <text
              x={x(0) - 6}
              y={y(f) + 4}
              textAnchor="end"
              fontSize="9"
              fill="#9ca3af"
            >
              {(f * 100).toFixed(0)}%
            </text>
            <text
              x={x(f)}
              y={H - 16}
              textAnchor="middle"
              fontSize="9"
              fill="#9ca3af"
            >
              {(f * 100).toFixed(0)}%
            </text>
          </g>
        ))}
        <line
          x1={x(0)}
          y1={y(0)}
          x2={x(1)}
          y2={y(1)}
          stroke="#9CA3AF"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        {series.map((s) => (
          <g key={s.name}>
            {s.pts.length > 1 && (
              <path
                d={s.pts
                  .map(
                    (b, i) =>
                      `${i === 0 ? "M" : "L"} ${x(b.meanPredicted)} ${y(b.observedFrequency)}`
                  )
                  .join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {s.pts.map((b, i) => (
              <circle
                key={i}
                cx={x(b.meanPredicted)}
                cy={y(b.observedFrequency)}
                r={Math.min(3 + Math.sqrt(b.count), 7)}
                fill={s.color}
                fillOpacity="0.85"
                stroke="white"
                strokeWidth="1.5"
              />
            ))}
          </g>
        ))}
        <text
          x={x(0.5)}
          y={H - 3}
          textAnchor="middle"
          fontSize="9"
          fill="#6b7280"
        >
          Probabilidad predicha
        </text>
        <text
          x={12}
          y={y(0.5)}
          textAnchor="middle"
          fontSize="9"
          fill="#6b7280"
          transform={`rotate(-90 12 ${y(0.5)})`}
        >
          Frecuencia observada
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        {series.map((s) => (
          <span
            key={s.name}
            className="flex items-center gap-1.5 text-xs text-gray-500"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {modelLabel(s.name)}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="inline-block h-0 w-5 border-t-2 border-dashed border-gray-400" />
          Calibración perfecta
        </span>
      </div>
    </div>
  )
}

interface ForecastPanelProps {
  electionId: string
  token: string
  refreshKey?: number
}

interface ForecastData {
  key: string
  compare: CompareResponse | null
  backtest: BacktestReport | null
  error: string | null
}

export function ForecastPanel({
  electionId,
  token,
  refreshKey = 0,
}: ForecastPanelProps) {
  const [data, setData] = useState<ForecastData | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [snapshotting, setSnapshotting] = useState(false)
  const [snapshotMsg, setSnapshotMsg] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const requestKey = `${electionId}:${refreshKey}:${reloadKey}`

  useEffect(() => {
    let cancelled = false
    Promise.all([
      compareModels(electionId, token),
      getBacktest(electionId, token),
    ])
      .then(([cmp, bt]) => {
        if (!cancelled)
          setData({ key: requestKey, compare: cmp, backtest: bt, error: null })
      })
      .catch((e) => {
        if (!cancelled) {
          setData({
            key: requestKey,
            compare: null,
            backtest: null,
            error:
              e instanceof Error ? e.message : "Error al cargar el pronóstico",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [electionId, token, requestKey])

  const loading = data?.key !== requestKey
  const compare = data?.compare ?? null
  const backtest = data?.backtest ?? null
  const error = data?.error ?? null

  const handleSnapshot = useCallback(() => {
    setSnapshotting(true)
    setSnapshotMsg(null)
    captureSnapshot(electionId, token)
      .then(() => {
        setSnapshotMsg("Snapshot capturado")
        setReloadKey((k) => k + 1)
      })
      .catch((e) =>
        setSnapshotMsg(
          e instanceof Error ? e.message : "No se pudo capturar el snapshot"
        )
      )
      .finally(() => setSnapshotting(false))
  }, [electionId, token])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm">Calculando pronóstico…</span>
        </div>
      </div>
    )
  }

  if (error || !compare) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        <AlertTriangle size={16} className="flex-shrink-0" />
        {error ?? "No se pudo cargar el pronóstico"}
      </div>
    )
  }

  const active: ForecastResult | null =
    compare.models.find((m) => m.modelName === selectedModel) ??
    compare.models[0] ??
    null

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
            Modelo
          </span>
          <div className="flex flex-wrap gap-1.5">
            {compare.models.map((m) => {
              const isActive = m.modelName === active?.modelName
              return (
                <button
                  key={m.modelName}
                  onClick={() => setSelectedModel(m.modelName)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                  style={
                    isActive
                      ? {
                          backgroundColor: modelColor(m.modelName),
                          color: "#fff",
                        }
                      : { backgroundColor: "#F3F4F6", color: "#4B5563" }
                  }
                >
                  {modelLabel(m.modelName)}
                </button>
              )
            })}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {snapshotMsg && (
            <span className="text-xs text-gray-400">{snapshotMsg}</span>
          )}
          <button
            onClick={handleSnapshot}
            disabled={snapshotting}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm transition hover:border-gray-300 disabled:opacity-50"
          >
            {snapshotting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            Capturar snapshot
          </button>
        </div>
      </div>

      {active && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
            <SectionHeader
              title="Pronóstico del ganador"
              subtitle={modelLabel(active.modelName)}
              icon={<Trophy size={18} />}
            />
            {!active.hasEnoughData || !active.projectedWinner ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Aún no hay votos suficientes para pronosticar
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white"
                    style={{ backgroundColor: modelColor(active.modelName) }}
                  >
                    <Trophy size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold" style={{ color: BRAND }}>
                      {active.projectedWinner.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {active.confidenceLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] tracking-wide text-gray-400 uppercase">
                      Prob. de victoria
                    </p>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: modelColor(active.modelName) }}
                    >
                      {formatPercent(active.winProbability)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 text-center">
                  <div>
                    <p className="text-[10px] tracking-wide text-gray-400 uppercase">
                      Margen actual
                    </p>
                    <p className="text-xl font-bold text-gray-700">
                      {formatPercent(active.margin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-wide text-gray-400 uppercase">
                      Votantes pendientes
                    </p>
                    <p className="text-xl font-bold text-amber-600">
                      {active.remainingVoters}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] tracking-wide text-gray-400 uppercase">
                      2.° lugar
                    </p>
                    <p className="truncate text-sm font-semibold text-gray-600">
                      {active.runnerUp?.name ?? "—"}
                    </p>
                  </div>
                </div>

                {active.projection.length > 0 && (
                  <div className="space-y-2 border-t border-gray-100 pt-4">
                    <p className="text-xs font-semibold text-gray-500">
                      Proyección de votos finales (IC 95%)
                    </p>
                    {active.projection.map((p) => (
                      <div
                        key={p.associationId}
                        className="flex items-center gap-3 text-xs"
                      >
                        <span className="w-32 truncate text-gray-600 sm:w-44">
                          {p.name}
                        </span>
                        <span className="text-gray-400">
                          {p.currentVotes} hoy
                        </span>
                        <span className="ml-auto font-semibold text-gray-700">
                          {p.projectedVotesLow}–{p.projectedVotesHigh} votos
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <p className="border-t border-gray-100 pt-3 text-[11px] leading-relaxed text-gray-400">
                  {active.method}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <SectionHeader
              title="Participación final"
              subtitle="Proyección de la serie temporal"
              icon={<Activity size={18} />}
            />
            {active.turnoutForecast ? (
              <div className="space-y-3">
                <p
                  className="text-center text-4xl font-bold"
                  style={{ color: BRAND }}
                >
                  {toPercent(active.turnoutForecast.finalTurnout).toFixed(1)}%
                </p>
                <p className="text-center text-xs text-gray-400">
                  Banda: {toPercent(active.turnoutForecast.low).toFixed(1)}% –{" "}
                  {toPercent(active.turnoutForecast.high).toFixed(1)}%
                </p>
                <div className="relative h-3 w-full rounded-full bg-gray-100">
                  <div
                    className="absolute h-3 rounded-full bg-emerald-100"
                    style={{
                      left: `${toPercent(active.turnoutForecast.low)}%`,
                      width: `${Math.max(toPercent(active.turnoutForecast.high) - toPercent(active.turnoutForecast.low), 1)}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full"
                    style={{
                      left: `${toPercent(active.turnoutForecast.finalTurnout)}%`,
                      backgroundColor: "#059669",
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-400">
                Este modelo no proyecta participación. Selecciona «Serie
                temporal» (requiere al menos 3 snapshots).
              </p>
            )}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="px-5 pt-5">
          <SectionHeader
            title="Comparación de modelos"
            subtitle="Los tres modelos evaluados sobre el estado actual"
            icon={<Scale size={18} />}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Modelo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Ganador proyectado
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Prob. victoria
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Margen
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold tracking-wide text-gray-500 uppercase">
                  Participación final
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {compare.models.map((m) => (
                <tr
                  key={m.modelName}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-800">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: modelColor(m.modelName) }}
                      />
                      {modelLabel(m.modelName)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {m.projectedWinner?.name ?? "—"}
                  </td>
                  <td
                    className="px-4 py-3 text-right text-sm font-semibold"
                    style={{ color: modelColor(m.modelName) }}
                  >
                    {m.hasEnoughData ? formatPercent(m.winProbability) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600">
                    {m.hasEnoughData ? formatPercent(m.margin) : "—"}
                  </td>
                  <td className="px-5 py-3 text-right text-sm text-gray-600">
                    {m.turnoutForecast
                      ? `${toPercent(m.turnoutForecast.finalTurnout).toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <SectionHeader
          title="Backtesting"
          subtitle={
            backtest && backtest.totalSnapshots > 0
              ? `${backtest.totalSnapshots} snapshots evaluados contra el resultado real`
              : "Evaluación retrospectiva de los modelos"
          }
          icon={<FlaskConical size={18} />}
        />
        {!backtest || backtest.totalSnapshots < 2 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <TrendingUp size={24} className="text-gray-300" />
            <p className="text-sm text-gray-400">
              Aún no hay snapshots suficientes para el backtesting.
            </p>
            <p className="max-w-md text-xs text-gray-400">
              Los snapshots se capturan automáticamente mientras la elección
              está abierta, o manualmente con el botón «Capturar snapshot».
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px]">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      Modelo
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      Brier
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      ECE
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      MAE
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      RMSE
                    </th>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      Decisión
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                      Acertó
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {backtest.models.map((m) => (
                    <tr
                      key={m.modelName}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-3 py-2.5">
                        <span className="flex items-center gap-2 text-xs font-medium text-gray-800">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: modelColor(m.modelName) }}
                          />
                          {modelLabel(m.modelName)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-600">
                        {m.brierScore.toFixed(3)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-600">
                        {m.expectedCalibrationError.toFixed(3)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-600">
                        {m.projectionMae.toFixed(1)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-600">
                        {m.projectionRmse.toFixed(1)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-gray-600">
                        {m.decisionTurnoutFraction !== null
                          ? `${toPercent(m.decisionTurnoutFraction).toFixed(0)}%`
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs">
                        {m.correctWinnerAtEnd ? "✅" : "❌"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
                Brier y ECE evalúan la probabilidad de victoria (menor es
                mejor). MAE y RMSE miden el error de la proyección de votos.
                «Decisión» es la participación a la que el modelo fijó al
                ganador correcto.
              </p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-gray-500">
                Curva de calibración
              </p>
              <CalibrationChart report={backtest} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
