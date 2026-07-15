import type { ReactElement } from "react"
import { createElement } from "react"
import { BRAND } from "@/lib/brand"

export { toPercent } from "@/lib/brand"

export const ELECTION_STATUS_LABELS: Record<string, string> = {
  open: "Activa",
  closed: "Finalizada",
  draft: "Borrador",
  scheduled: "Programada",
  cancelled: "Archivada",
}

export const ELECTION_STATUS_COLORS: Record<string, string> = {
  open: "#16A34A",
  closed: "#475569",
  draft: "#A16207",
  scheduled: "#1D4ED8",
  cancelled: "#94A3B8",
}

export function formatPercent(n: number): string {
  return `${(n <= 1 ? n * 100 : n).toFixed(1)}%`
}

export function renderMarkdown(text: string): ReactElement[] {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    return createElement(
      "p",
      {
        key: i,
        className: line.trim() === "" ? "h-2" : "text-sm leading-relaxed text-gray-600",
      },
      parts.map((p, j) =>
        p.startsWith("**") && p.endsWith("**")
          ? createElement("strong", { key: j, style: { color: BRAND } }, p.slice(2, -2))
          : createElement("span", { key: j }, p.replace(/^[-•]\s*/, "• ")),
      ),
    )
  })
}
