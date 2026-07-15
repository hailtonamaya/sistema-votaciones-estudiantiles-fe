import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { UnitecLogo } from "@/components/UnitecLogo"
import { OTPInput } from "@/components/student/OTPInput"
import { useAuth } from "@/context/AuthContext"
import { verifyOTP } from "@/services/voting.service"
import { BRAND } from "@/lib/brand"

export default function OTPPage() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { pendingEmail, login } = useAuth()

  // Capturar el email al montar: login() pone pendingEmail=null en el contexto,
  // lo que causaría que el guard de abajo navegue a /login y cancele el redirect
  // al dashboard. Con useState local el email sobrevive ese re-render.
  const [email] = useState(pendingEmail)

  useEffect(() => {
    if (!email) navigate("/login", { replace: true })
  }, [email, navigate])

  const code = digits.join("")
  const complete = code.length === 6 && digits.every(Boolean)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!complete || loading || !email) return

    setLoading(true)
    setError("")

    try {
      const { token, user } = await verifyOTP(email, code)
      login(token, user)

      if (user.role === "admin") {
        navigate("/admin/dashboard")
      } else if (user.role === "observer") {
        navigate("/observer/dashboard")
      } else if (user.role === "student") {
        navigate("/student/votar")
      } else {
        navigate("/login")
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Código incorrecto o expirado. Inténtalo de nuevo.",
      )
      setLoading(false)
    }
  }

  if (!email) return null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg-light px-4">
      <div className="mb-8">
        <UnitecLogo size="lg" />
      </div>

      <h1 className="mb-2 text-xl font-bold sm:text-2xl" style={{ color: BRAND }}>
        Verificación de Identidad
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Ingresa el código enviado a tu correo
      </p>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} noValidate>
          <p className="mb-4 text-center text-sm" style={{ color: BRAND }}>
            Hemos enviado un código de 6 dígitos a
            <br />
            <span className="font-semibold">{email}</span>
          </p>

          <div className="flex justify-center">
            <OTPInput value={digits} onChange={setDigits} />
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !complete}
            className="mt-6 w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: BRAND }}
          >
            {loading ? "Verificando..." : "Acceder"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-3 w-full rounded-lg py-2 text-sm text-gray-500 transition hover:opacity-80"
            style={{ color: BRAND }}
          >
            Volver
          </button>
        </form>
      </div>
    </main>
  )
}
