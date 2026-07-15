import type { ReactNode } from "react"
import { BRAND } from "@/lib/brand"

interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: ReactNode
}

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-8 py-20 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
        {icon}
      </div>
      <p className="mb-2 text-lg font-bold" style={{ color: BRAND }}>
        {title}
      </p>
      <p className="mb-6 max-w-sm text-sm text-gray-500">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          {action.icon}
          {action.label}
        </button>
      )}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="mt-3 text-sm font-medium underline-offset-2 hover:underline"
          style={{ color: BRAND }}
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  )
}
