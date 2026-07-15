import { useEffect, useState } from "react"
import { BRAND } from "@/lib/brand"

interface Props {
  startTime: Date
}

export function VotingTimer({ startTime }: Props) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium" style={{ color: BRAND }}>
      <span className="hidden text-xs text-gray-500 sm:inline">Tiempo transcurrido:</span>
      <svg
        aria-hidden="true"
        focusable="false"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>
        {minutes} : {String(seconds).padStart(2, "0")}
      </span>
    </div>
  )
}
