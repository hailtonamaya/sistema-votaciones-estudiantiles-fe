export const BRAND = "#06065C" as const
export const ACCENT = "#03AED2" as const
export const BG_LIGHT = "#EDF0F5" as const
export const BRAND_AVATAR = "#0F49B6" as const

/** Normaliza un porcentaje que puede venir como 0-1 o 0-100 → siempre retorna 0-100 */
export function toPercent(n: number): number {
  return n <= 1 ? n * 100 : n
}
