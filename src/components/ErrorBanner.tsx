import { AlertCircle } from "lucide-react"

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      <AlertCircle size={16} className="flex-shrink-0" />
      {message}
    </div>
  )
}
