import { AdminLayout } from "@/components/AdminLayout"
import { Construction } from "lucide-react"

interface Props {
  title: string
}

export default function AdminPlaceholder({ title }: Props) {
  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#1B2770]">{title}</h1>
      </div>
      <div className="flex min-h-[360px] items-center justify-center rounded-2xl bg-white shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <Construction size={36} className="text-gray-300" />
          <p className="text-sm font-medium text-gray-400">Módulo en construcción</p>
          <p className="text-xs text-gray-300">Esta sección estará disponible próximamente.</p>
        </div>
      </div>
    </AdminLayout>
  )
}
