import { Download, Filter, LayoutGrid, List, Plus, Search, Upload } from "lucide-react"
import { BRAND, ACCENT } from "@/lib/brand"

interface WizardToolbarProps {
  search: string
  onSearchChange: (v: string) => void
  view: "grid" | "list"
  onViewChange: (v: "grid" | "list") => void
  addLabel: string
  onAdd: () => void
  importLabel?: string
  onImport?: () => void
}

export function WizardToolbar({
  search,
  onSearchChange,
  view,
  onViewChange,
  addLabel,
  onAdd,
  importLabel,
  onImport,
}: WizardToolbarProps) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
        <Search size={15} className="text-gray-400" />
        <input
          type="text"
          placeholder="Buscar"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-40 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>
      <button
        type="button"
        disabled
        title="Próximamente"
        className="flex cursor-not-allowed items-center justify-center rounded-lg px-3 py-2.5 text-white opacity-40 shadow-sm"
        style={{ backgroundColor: BRAND }}
      >
        <Filter size={15} />
      </button>
      <button
        type="button"
        disabled
        title="Próximamente"
        className="cursor-not-allowed rounded-lg px-4 py-2.5 text-sm font-semibold text-white opacity-40 shadow-sm"
        style={{ backgroundColor: BRAND }}
      >
        Buscar
      </button>
      <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {(["grid", "list"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onViewChange(v)}
            aria-label={v === "grid" ? "Vista cuadrícula" : "Vista lista"}
            aria-pressed={view === v}
            className="flex h-11 w-11 items-center justify-center transition"
            style={{
              backgroundColor: view === v ? BRAND : "transparent",
              color: view === v ? "#fff" : "#9CA3AF",
            }}
          >
            {v === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled
        title="Próximamente"
        className="flex cursor-not-allowed items-center gap-1 rounded-lg px-3 py-2.5 text-white opacity-40 shadow-sm"
        style={{ backgroundColor: BRAND }}
      >
        <Download size={15} />
      </button>
      <div className="ml-auto flex items-center gap-2">
        {onImport && importLabel && (
          <button
            type="button"
            onClick={onImport}
            className="flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:opacity-90"
            style={{ borderColor: ACCENT, color: ACCENT, backgroundColor: "#fff" }}
          >
            <Upload size={15} />
            {importLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          style={{ backgroundColor: BRAND }}
        >
          <Plus size={15} />
          {addLabel}
        </button>
      </div>
    </div>
  )
}
