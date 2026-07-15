import { BRAND } from "@/lib/brand"

interface SectionHeaderProps {
  title: string
  subtitle: string
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold" style={{ color: BRAND }}>
        {title}
      </h1>
      <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}
