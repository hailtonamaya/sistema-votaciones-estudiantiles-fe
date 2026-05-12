import { useState } from "react"
import { AdminLayout } from "@/components/AdminLayout"
import {
  BarChart2,
  ChevronDown,
  FileText,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  ListOrdered,
  Play,
  Plus,
  TrendingUp,
} from "lucide-react"

// Federal Blue #06065C | Cobalt Blue #0F49B6 | Pacific Cyan #03AED2 | Vivid Sky Blue #47C8F0

const CARRERAS = [
  "Ingeniería en Sistemas",
  "Administración de Empresas",
  "Derecho",
  "Medicina",
  "Animación Digital y Diseño Interactivo",
  "Ciencia de Datos e Inteligencia Artificial",
]

const MOCK_HAS_ACTIVE_ELECTION = false

// ── SVG charts ─────────────────────────────────────────────

function LineChart() {
  const pts: [number, number][] = [
    [0, 190], [60, 185], [120, 170], [180, 140],
    [240, 100], [300, 50], [360, 10],
  ]
  const d = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ")
  return (
    <svg viewBox="0 0 380 200" className="w-full" preserveAspectRatio="none">
      {[0, 50, 100, 150, 200].map((y) => (
        <line key={y} x1="0" y1={y} x2="380" y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
      ))}
      <path d={d} fill="none" stroke="#06065C" strokeWidth="2.5" strokeLinecap="round" />
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#06065C" />)}
    </svg>
  )
}

function BarChartSvg() {
  const bars = [
    { value: 55, color: "#47C8F0" },
    { value: 70, color: "#47C8F0" },
    { value: 120, color: "#03AED2" },
  ]
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {[0, 50, 100, 150, 200].map((y) => (
        <line key={y} x1="0" y1={200 - y} x2="360" y2={200 - y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
      ))}
      {bars.map((bar, i) => {
        const h = (bar.value / 200) * 190
        return <rect key={i} x={30 + i * 90} y={200 - h} width={60} height={h} fill={bar.color} rx="4" />
      })}
    </svg>
  )
}

function StackedBarChartSvg() {
  const bars = [
    { segs: [{ color: "#03AED2", val: 50 }] },
    { segs: [{ color: "#47C8F0", val: 60 }] },
    { segs: [{ color: "#06065C", val: 70 }, { color: "#0F49B6", val: 60 }] },
  ]
  return (
    <svg viewBox="0 0 360 200" className="w-full">
      {[0, 50, 100, 150, 200].map((y) => (
        <line key={y} x1="0" y1={200 - y} x2="360" y2={200 - y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4" />
      ))}
      {bars.map((bar, i) => {
        let yOff = 200
        return (
          <g key={i}>
            {bar.segs.map((seg, si) => {
              const h = (seg.val / 200) * 190
              yOff -= h
              return (
                <rect key={si} x={30 + i * 90} y={yOff} width={60} height={h} fill={seg.color}
                  rx={si === bar.segs.length - 1 ? 4 : 0} />
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}

interface ChartCardProps {
  title: string
  subtitle: string
  icon: React.ReactNode
  yLabels: string[]
  xLabels: string[]
  chart: React.ReactNode
}

function ChartCard({ title, subtitle, icon, yLabels, xLabels, chart }: ChartCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold" style={{ color: "#06065C" }}>{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#EDF0F5", color: "#06065C" }}>
          {icon}
        </div>
      </div>
      <div className="flex">
        <div className="flex w-8 flex-col-reverse justify-between pr-1 text-right">
          {yLabels.map((l) => <span key={l} className="text-[10px] text-gray-400">{l}</span>)}
        </div>
        <div className="flex-1">{chart}</div>
      </div>
      <div className="mt-1 flex justify-around pl-8">
        {xLabels.map((l) => <span key={l} className="text-center text-[10px] text-gray-400">{l}</span>)}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [selectedCarrera, setSelectedCarrera] = useState("")
  const [carreraOpen, setCarreraOpen] = useState(false)
  const [accionesOpen, setActionsOpen] = useState(false)
  const hasActiveElection = MOCK_HAS_ACTIVE_ELECTION

  // Tabs defined inside render to avoid module-level JSX
  const tabs = [
    { id: "dashboard", label: "Dashboard General", icon: <LayoutDashboard size={15} /> },
    { id: "ranking", label: "Ranking de Planillas", icon: <ListOrdered size={15} /> },
    { id: "escrutinio", label: "Tabla de Escrutinio", icon: <FileText size={15} /> },
  ]

  return (
    <AdminLayout>
      {/* Title */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: "#06065C" }}>
          Dashboard General - Elecciones 2026
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Aquí podrás ver el progreso de las elecciones.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        {hasActiveElection && (
          <div className="flex items-center gap-2 rounded-full border border-green-400 px-4 py-1.5">
            <Play size={12} className="fill-green-500 text-green-500" />
            <span className="text-sm font-semibold text-green-600">Activa</span>
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-3">
          {/* Carrera dropdown */}
          <div className="relative">
            <button
              onClick={() => { setCarreraOpen((p) => !p); setActionsOpen(false) }}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm transition hover:border-gray-300"
            >
              <span className="max-w-[160px] truncate sm:max-w-[220px]">
                {selectedCarrera || "Selecciona una carrera"}
              </span>
              <ChevronDown size={15} />
            </button>
            {carreraOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-xl border border-gray-100 bg-white shadow-lg">
                {CARRERAS.map((c) => (
                  <button key={c} onClick={() => { setSelectedCarrera(c); setCarreraOpen(false) }}
                    className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-xl last:rounded-b-xl">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Simular */}
          <button
            disabled={!hasActiveElection}
            className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition"
            style={{ backgroundColor: hasActiveElection ? "#06065C" : "#9ca3af" }}
          >
            Simular
          </button>

          {/* Acciones */}
          <div className="relative">
            <button
              onClick={() => { setActionsOpen((p) => !p); setCarreraOpen(false) }}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300"
            >
              Acciones <ChevronDown size={15} />
            </button>
            {accionesOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-gray-100 bg-white shadow-lg">
                <button className="block w-full rounded-t-xl px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">Exportar datos</button>
                <button className="block w-full rounded-b-xl px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50">Ver historial</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-full overflow-x-auto pb-1 sm:w-fit sm:pb-0">
        <div className="flex items-center gap-2 rounded-xl bg-white p-1.5 shadow-sm whitespace-nowrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition"
              style={
                activeTab === tab.id
                  ? { backgroundColor: "#06065C", color: "#ffffff" }
                  : { color: "#06065C" }
              }
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "dashboard" && (
        !hasActiveElection ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
            <div className="flex flex-col items-center gap-4 px-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full"
                style={{ backgroundColor: "#EDF0F5" }}>
                <Landmark size={32} style={{ color: "#06065C" }} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: "#06065C" }}>
                  Aún no hay elecciones activas
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Crea una nueva eleccion para ver el progreso en el dashboard
                </p>
              </div>
              <button
                className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition"
                style={{ backgroundColor: "#06065C" }}
              >
                <Plus size={16} />
                Nueva Elección
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ChartCard title="Participación por Hora" subtitle="Votos acumulados durante la jornada"
                icon={<TrendingUp size={18} />} yLabels={["200", "150", "100", "50", "0"]}
                xLabels={["08:00", "10:00", "12:00", "14:00", "16:00"]} chart={<LineChart />} />
              <ChartCard title="Votos por carrera" subtitle="Facultades con mayor participación"
                icon={<GraduationCap size={18} />} yLabels={["200", "150", "100", "50", "0"]}
                xLabels={["Animación Digital", "Ciencia de Datos", "Ingeniería"]} chart={<BarChartSvg />} />
            </div>
            <ChartCard title="Distribución de Votos: Carrera y Planilla"
              subtitle="Preferencias de asociación por facultad"
              icon={<BarChart2 size={18} />} yLabels={["200", "150", "100", "50", "0"]}
              xLabels={["Animación Digital", "Ciencia de Datos", "Ingeniería en Sistemas"]}
              chart={<StackedBarChartSvg />} />
          </div>
        )
      )}

      {activeTab === "ranking" && (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
          <p className="text-sm text-gray-400">Ranking de Planillas — próximamente</p>
        </div>
      )}

      {activeTab === "escrutinio" && (
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
          <p className="text-sm text-gray-400">Tabla de Escrutinio — próximamente</p>
        </div>
      )}
    </AdminLayout>
  )
}
