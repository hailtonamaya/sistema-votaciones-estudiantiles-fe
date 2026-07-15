import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: string | number
  color: string
  icon?: ReactNode
}

export function StatCard({ label, value, color, icon }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{label}</p>
        {icon && (
          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-bg-light"
            style={{ color }}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold sm:text-3xl" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
