import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"

export type RevisionStatus = "ok" | "warning" | "incomplete"

const STATUS_CONFIG = {
  ok: { bg: "#DCFCE7", color: "#16A34A", icon: <CheckCircle2 size={14} />, label: "Completo" },
  warning: { bg: "#FEF9C3", color: "#A16207", icon: <AlertCircle size={14} />, label: "Revisar" },
  incomplete: { bg: "#FEE2E2", color: "#DC2626", icon: <XCircle size={14} />, label: "Incompleto" },
} as const

export function StatusBadge({ status }: { status: RevisionStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <div
      className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      {cfg.icon}
      {cfg.label}
    </div>
  )
}
