import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { BRAND, ACCENT } from "@/lib/brand"

interface BtnProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
}

export function BtnPrimary({ children, onClick, disabled, loading }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: BRAND }}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}

export function BtnSecondary({
  children,
  onClick,
}: Pick<BtnProps, "children" | "onClick">) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
    >
      {children}
    </button>
  )
}

export function BtnAccent({ children, onClick, disabled, loading }: BtnProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      style={{ backgroundColor: ACCENT }}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  )
}
