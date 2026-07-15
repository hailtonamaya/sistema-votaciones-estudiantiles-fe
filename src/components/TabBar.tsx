import type { ReactNode } from "react"
import { BRAND } from "@/lib/brand"

interface Tab {
  id: string
  label: string
  icon?: ReactNode
}

interface TabBarProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function TabBar({ tabs, activeTab, onChange, className = "mb-6" }: TabBarProps) {
  return (
    <div className={`flex w-full overflow-x-auto pb-1 sm:w-fit sm:pb-0 ${className}`}>
      <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 shadow-sm whitespace-nowrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
            style={
              activeTab === tab.id
                ? { backgroundColor: BRAND, color: "#ffffff" }
                : { color: BRAND }
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
