import { Component, type ReactNode } from "react"
import { BRAND } from "@/lib/brand"

interface State {
  error: Error | null
}

export class ChunkErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg-light px-4 text-center">
          <p className="text-sm text-gray-500">
            Error al cargar la página. Recarga e intenta de nuevo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
