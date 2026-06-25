import { useCallback, useEffect, useRef } from "react"

export function useClickOutside<T extends HTMLElement>(handler: () => void) {
  const ref = useRef<T>(null)
  const stableHandler = useCallback(() => handler(), [handler])

  useEffect(() => {
    function listener(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        stableHandler()
      }
    }
    document.addEventListener("mousedown", listener)
    return () => document.removeEventListener("mousedown", listener)
  }, [stableHandler])

  return ref
}
