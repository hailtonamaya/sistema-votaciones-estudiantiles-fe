import { useMemo, useRef, useState, type ReactNode } from "react"
import { BRAND } from "@/lib/brand"
import type { AssociationTally, CareerBreakdown, HourlyPoint } from "@/services/results.service"

/* Orden fijo validado (CVD + contraste); las planillas conservan su color
   aunque cambie el filtro o el orden. */
const SERIES_PALETTE = ["#0F49B6", "#03AED2", "#7C3AED", "#059669", "#D97706", "#DB2777"] as const

const TRACK = "#EDF0F5"
const GRID = "#e5e7eb"
const INK_MUTED = "#9ca3af"
const INK_SOFT = "#6b7280"

function seriesColor(index: number): string {
  return SERIES_PALETTE[index % SERIES_PALETTE.length]
}

function formatPct(share: number): string {
  return `${(share * 100).toFixed(1)}%`
}

function ChartEmpty({ label }: { label: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl bg-gray-50">
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  )
}

/* ── Tooltip flotante compartido ──────────────────────────────── */

interface TipState {
  x: number
  y: number
  content: ReactNode
}

function useTooltip() {
  const [tip, setTip] = useState<TipState | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const show = (e: { clientX: number; clientY: number }, content: ReactNode) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box) return
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, content })
  }
  const hide = () => setTip(null)
  return { ref, tip, show, hide }
}

function TooltipBox({ tip }: { tip: TipState | null }) {
  if (!tip) return null
  return (
    <div
      className="pointer-events-none absolute z-20 max-w-[220px] rounded-lg bg-gray-900/95 px-3 py-2 text-xs text-white shadow-lg"
      style={{
        left: tip.x,
        top: tip.y - 10,
        transform: `translate(${tip.x > 240 ? "-100%" : "12px"}, -100%)`,
      }}
    >
      {tip.content}
    </div>
  )
}

/* ── Participación por hora (área acumulada) ──────────────────── */

export function HourlyTurnoutChart({ points }: { points: HourlyPoint[] }) {
  const { ref, tip, show, hide } = useTooltip()
  const [hovered, setHovered] = useState<number | null>(null)

  const data = points.filter((p) => p.cumulative > 0 || p.count > 0)
  if (data.length === 0) {
    return <ChartEmpty label="Aún no hay votos registrados en esta jornada" />
  }

  const W = 520
  const H = 176
  const PAD = { top: 14, right: 16, bottom: 26, left: 38 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom
  const maxY = Math.max(...data.map((p) => p.cumulative), 1)
  const x = (i: number) => PAD.left + (data.length === 1 ? chartW / 2 : (i / (data.length - 1)) * chartW)
  const y = (v: number) => PAD.top + (1 - v / maxY) * chartH

  const line = data.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.cumulative)}`).join(" ")
  const area = `${line} L ${x(data.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`

  const yTicks = [...new Set([0, 0.5, 1].map((f) => Math.round(maxY * f)))]
  const labelEvery = Math.max(1, Math.ceil(data.length / 6))

  const onMove = (e: React.MouseEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const fx = ((e.clientX - rect.left) / rect.width) * W
    const i = Math.max(
      0,
      Math.min(data.length - 1, Math.round(((fx - PAD.left) / chartW) * (data.length - 1))),
    )
    setHovered(i)
    const p = data[i]
    show(e, (
      <div>
        <p className="font-semibold">{p.label}</p>
        <p>Votos de la hora: {p.count}</p>
        <p>Acumulado: {p.cumulative}</p>
      </div>
    ))
  }

  return (
    <div ref={ref} className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="turnout-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0F49B6" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0F49B6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} y1={y(t)} x2={W - PAD.right} y2={y(t)} stroke={GRID} strokeWidth="1" strokeDasharray="4" />
            <text x={PAD.left - 6} y={y(t) + 3.5} textAnchor="end" fontSize="9" fill={INK_MUTED}>
              {t}
            </text>
          </g>
        ))}
        {data.map((p, i) =>
          i % labelEvery === 0 ? (
            <text key={p.hour} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill={INK_MUTED}>
              {p.label}
            </text>
          ) : null,
        )}
        <path d={area} fill="url(#turnout-fill)" />
        <path d={line} fill="none" stroke="#0F49B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {hovered !== null && (
          <line
            x1={x(hovered)}
            y1={PAD.top}
            x2={x(hovered)}
            y2={y(0)}
            stroke={INK_SOFT}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        )}
        {data.map((p, i) => (
          <circle
            key={p.hour}
            cx={x(i)}
            cy={y(p.cumulative)}
            r={hovered === i ? 4.5 : i === data.length - 1 ? 3.5 : 0}
            fill="#0F49B6"
            stroke="white"
            strokeWidth="1.5"
          />
        ))}
        <text
          x={x(data.length - 1) - 6}
          y={y(data[data.length - 1].cumulative) - 8}
          textAnchor="end"
          fontSize="10"
          fontWeight="600"
          fill={BRAND}
        >
          {data[data.length - 1].cumulative}{" "}
          {data[data.length - 1].cumulative === 1 ? "voto" : "votos"}
        </text>
        <rect
          x={PAD.left}
          y={PAD.top}
          width={chartW}
          height={chartH}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => { setHovered(null); hide() }}
        />
      </svg>
      <TooltipBox tip={tip} />
    </div>
  )
}

/* ── Votos por carrera (barras con pista de habilitados) ──────── */

export function CareerVotesChart({ careers }: { careers: CareerBreakdown[] }) {
  const { ref, tip, show, hide } = useTooltip()

  const rows = useMemo(
    () => [...careers].sort((a, b) => b.voted - a.voted || b.turnout - a.turnout),
    [careers],
  )
  if (rows.length === 0) {
    return <ChartEmpty label="Sin carreras con votantes en esta elección" />
  }

  return (
    <div ref={ref} className="relative max-h-44 space-y-2.5 overflow-y-auto pr-1">
      {rows.map((c) => {
        const pct = Math.min(1, c.turnout)
        return (
          <div
            key={c.career_id}
            onMouseMove={(e) =>
              show(e, (
                <div>
                  <p className="font-semibold">{c.career_name}</p>
                  <p>Votaron {c.voted} de {c.eligible} habilitados</p>
                  <p>Participación: {formatPct(c.turnout)}</p>
                </div>
              ))
            }
            onMouseLeave={hide}
          >
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-medium text-gray-600">{c.career_name}</p>
              <p className="shrink-0 text-xs text-gray-400">
                <span className="font-semibold text-gray-600">{c.voted}</span>
                /{c.eligible} · {formatPct(c.turnout)}
              </p>
            </div>
            <div className="h-2.5 w-full rounded-full" style={{ backgroundColor: TRACK }}>
              <div
                className="h-2.5 rounded-full transition-all"
                style={{ width: `${pct * 100}%`, backgroundColor: "#0F49B6", minWidth: c.voted > 0 ? 6 : 0 }}
              />
            </div>
          </div>
        )
      })}
      <TooltipBox tip={tip} />
    </div>
  )
}

/* ── Distribución de votos: carrera × planilla (apiladas) ─────── */

interface StackRow {
  careerId: string
  careerName: string
  total: number
  segments: Array<{ association: AssociationTally; colorIndex: number }>
}

export function CareerAssociationChart({
  associations,
}: {
  associations: AssociationTally[]
}) {
  const { ref, tip, show, hide } = useTooltip()

  const { rows, legend, maxTotal } = useMemo(() => {
    const colorByAssociation = new Map<string, number>()
    associations.forEach((a) => colorByAssociation.set(a.association_id, colorByAssociation.size))

    const byCareer = new Map<string, StackRow>()
    for (const a of associations) {
      const key = a.career_id ?? "general"
      const row = byCareer.get(key) ?? {
        careerId: key,
        careerName: a.career_name ?? "Sin carrera",
        total: 0,
        segments: [],
      }
      row.total += a.votes
      row.segments.push({ association: a, colorIndex: colorByAssociation.get(a.association_id) ?? 0 })
      byCareer.set(key, row)
    }
    const rows = [...byCareer.values()].sort((a, b) => b.total - a.total)
    const legend = associations.map((a) => ({
      id: a.association_id,
      name: a.name,
      color: seriesColor(colorByAssociation.get(a.association_id) ?? 0),
    }))
    const maxTotal = Math.max(...rows.map((r) => r.total), 1)
    return { rows, legend, maxTotal }
  }, [associations])

  if (associations.length === 0) {
    return <ChartEmpty label="Sin planillas con votos todavía" />
  }

  return (
    <div ref={ref} className="relative">
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.careerId}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <p className="truncate text-xs font-medium text-gray-600">{row.careerName}</p>
              <p className="shrink-0 text-xs text-gray-400">
                {row.total} {row.total === 1 ? "voto" : "votos"}
              </p>
            </div>
            <div
              className="flex h-5 w-full gap-[2px] rounded-md"
              style={{ backgroundColor: row.total === 0 ? TRACK : "transparent" }}
            >
              {row.total > 0 &&
                row.segments
                  .filter((s) => s.association.votes > 0)
                  .map((s) => {
                    const widthPct = (s.association.votes / maxTotal) * 100
                    const shareInCareer = s.association.votes / row.total
                    return (
                      <div
                        key={s.association.association_id}
                        className="flex h-5 items-center justify-center overflow-hidden rounded-[4px] first:rounded-l-md"
                        style={{ width: `${widthPct}%`, backgroundColor: seriesColor(s.colorIndex), minWidth: 10 }}
                        onMouseMove={(e) =>
                          show(e, (
                            <div>
                              <p className="font-semibold">{s.association.name}</p>
                              <p>{row.careerName}</p>
                              <p>
                                {s.association.votes} {s.association.votes === 1 ? "voto" : "votos"} ·{" "}
                                {formatPct(shareInCareer)} de la carrera
                              </p>
                            </div>
                          ))
                        }
                        onMouseLeave={hide}
                      >
                        {shareInCareer >= 0.18 && widthPct >= 9 && (
                          <span className="px-1 text-[10px] font-semibold text-white">
                            {Math.round(shareInCareer * 100)}%
                          </span>
                        )}
                      </div>
                    )
                  })}
              {row.total === 0 && (
                <span className="px-2 text-[10px] leading-5 text-gray-400">Sin votos</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3">
        {legend.map((l) => (
          <span key={l.id} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
            {l.name}
          </span>
        ))}
      </div>
      <TooltipBox tip={tip} />
    </div>
  )
}

/* ── Ranking de planillas ─────────────────────────────────────── */

export function PlanillasRanking({ associations }: { associations: AssociationTally[] }) {
  const rows = useMemo(
    () => [...associations].sort((a, b) => b.votes - a.votes),
    [associations],
  )
  const maxVotes = Math.max(...rows.map((r) => r.votes), 1)

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
        <p className="text-sm text-gray-400">Sin planillas registradas en esta elección</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="mb-4 text-sm font-semibold" style={{ color: BRAND }}>
        Ranking de Planillas
      </p>
      <div className="space-y-3">
        {rows.map((a, i) => (
          <div key={a.association_id} className="flex items-center gap-3">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={
                i === 0
                  ? { backgroundColor: BRAND, color: "white" }
                  : { backgroundColor: TRACK, color: INK_SOFT }
              }
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium text-gray-700">
                  {a.name}
                  {a.career_name && (
                    <span className="ml-2 text-xs font-normal text-gray-400">{a.career_name}</span>
                  )}
                </p>
                <p className="shrink-0 text-xs text-gray-400">
                  <span className="text-sm font-semibold" style={{ color: BRAND }}>{a.votes}</span>{" "}
                  · {formatPct(a.share)}
                </p>
              </div>
              <div className="h-2 w-full rounded-full" style={{ backgroundColor: TRACK }}>
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${(a.votes / maxVotes) * 100}%`,
                    backgroundColor: "#0F49B6",
                    minWidth: a.votes > 0 ? 6 : 0,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Tabla de escrutinio ──────────────────────────────────────── */

export function EscrutinioTable({
  careers,
  associations,
  totals,
}: {
  careers: CareerBreakdown[]
  associations: AssociationTally[]
  totals: { eligible: number; voted: number; turnout: number; valid_votes: number; blank_votes: number }
}) {
  const leaderByCareer = useMemo(() => {
    const map = new Map<string, AssociationTally>()
    for (const a of associations) {
      if (!a.career_id) continue
      const cur = map.get(a.career_id)
      if (!cur || a.votes > cur.votes) map.set(a.career_id, a)
    }
    return map
  }, [associations])

  if (careers.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
        <p className="text-sm text-gray-400">Sin datos de escrutinio para esta elección</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="mb-4 text-sm font-semibold" style={{ color: BRAND }}>
        Tabla de Escrutinio
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
              <th className="pb-2 pr-4 font-medium">Carrera</th>
              <th className="pb-2 pr-4 text-right font-medium">Habilitados</th>
              <th className="pb-2 pr-4 text-right font-medium">Votaron</th>
              <th className="pb-2 pr-4 font-medium">Participación</th>
              <th className="pb-2 font-medium">Planilla líder</th>
            </tr>
          </thead>
          <tbody>
            {careers.map((c) => {
              const leader = leaderByCareer.get(c.career_id)
              return (
                <tr key={c.career_id} className="border-b border-gray-50">
                  <td className="py-2.5 pr-4 font-medium text-gray-700">
                    {c.career_name}
                    <span className="ml-1.5 text-xs font-normal text-gray-400">{c.career_code}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-right text-gray-600">{c.eligible}</td>
                  <td className="py-2.5 pr-4 text-right font-semibold" style={{ color: BRAND }}>
                    {c.voted}
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: TRACK }}>
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${Math.min(1, c.turnout) * 100}%`,
                            backgroundColor: "#0F49B6",
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{formatPct(c.turnout)}</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-gray-600">
                    {leader && leader.votes > 0 ? (
                      <>
                        {leader.name}
                        <span className="ml-1.5 text-xs text-gray-400">({leader.votes})</span>
                      </>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="text-sm font-semibold" style={{ color: BRAND }}>
              <td className="pt-3 pr-4">Total</td>
              <td className="pt-3 pr-4 text-right">{totals.eligible}</td>
              <td className="pt-3 pr-4 text-right">{totals.voted}</td>
              <td className="pt-3 pr-4">{formatPct(totals.turnout)}</td>
              <td className="pt-3 text-xs font-normal text-gray-400">
                Válidos: {totals.valid_votes} · En blanco: {totals.blank_votes}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
