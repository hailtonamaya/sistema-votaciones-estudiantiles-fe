import { useLayoutEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

export function WizardBottomBar({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<Element | null>(null)

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTarget(document.getElementById("admin-wizard-footer"))
  }, [])

  if (!target) return null

  return createPortal(
    <div
      className="flex flex-wrap items-center gap-3 border-t border-gray-200 bg-white px-6 py-4"
      style={{ boxShadow: "0 -2px 8px rgba(0,0,0,0.06)" }}
    >
      {children}
    </div>,
    target,
  )
}
