import { createContext, useContext, useState, type ReactNode } from "react"

export type UserRole = "admin" | "observer" | "student"

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  pendingEmail: string | null
}

interface AuthContextType extends AuthState {
  setPendingEmail: (email: string) => void
  login: (token: string, user: AuthUser) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = "auth_session"

function loadSession(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore parse errors
  }
  return { token: null, user: null, pendingEmail: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadSession)

  const setPendingEmail = (email: string) =>
    setState((s) => ({ ...s, pendingEmail: email }))

  const login = (token: string, user: AuthUser) => {
    const next: AuthState = { token, user, pendingEmail: null }
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setState({ token: null, user: null, pendingEmail: null })
  }

  return (
    <AuthContext.Provider value={{ ...state, setPendingEmail, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
