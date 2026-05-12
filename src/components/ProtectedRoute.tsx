import { Navigate } from "react-router-dom"
import { useAuth, type UserRole } from "@/context/AuthContext"
import type { ReactNode } from "react"

interface Props {
  roles: UserRole[]
  children: ReactNode
}

export function ProtectedRoute({ roles, children }: Props) {
  const { token, user } = useAuth()
  if (!token || !user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/login" replace />
  return <>{children}</>
}
