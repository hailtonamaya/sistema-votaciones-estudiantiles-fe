import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { UnitecLogo } from "@/components/UnitecLogo"
import { OTPInput } from "@/components/student/OTPInput"
import { useAuth } from "@/context/AuthContext"
import { useVoting } from "@/context/VotingContext"
import { verifyOTP, getStudentElection } from "@/services/voting.service"

export default function OTPPage() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { pendingEmail, login } = useAuth()
  const { setElection, startVoting } = useVoting()

  // Capturar el email al montar: login() pone pendingEmail=null en el contexto,
  // lo que causaría que el guard de abajo navegue a /login y cancele el redirect
  // al dashboard. Con useState local el email sobrevive ese re-render.
  const [email] = useState(pendingEmail)

  if (!email) {
    navigate("/login")
    return null
  }

  const code = digits.join("")
  const complete = code.length === 6 && digits.every(Boolean)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!complete || loading) return

    setLoading(true)
    setError("")

    try {
      const { token, user } = await verifyOTP(email, code)
      login(token, user)

      if (user.role === "student") {
        try {
          const election = await getStudentElection(token)
          setElection(election)
          startVoting()
          navigate("/student/votar")
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar la elección activa.",
          )
          setLoading(false)
        }
      } else if (user.role === "admin") {
        navigate("/admin/dashboard")
      } else if (user.role === "observer") {
        navigate("/observer/dashboard")
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EDF0F5] px-4">
      <div className="mb-8">
        <UnitecLogo size="lg" />
      </div>

      <h1 className="mb-2 text-2xl font-bold text-[#1B2770]">
        Verificación de Identidad
      </h1>
      <p className="mb-8 text-sm text-gray-500">
        Ingresa el código enviado a tu correo
      </p>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} noValidate>
          <p className="mb-4 text-center text-sm text-[#1B2770]">
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
            className="mt-6 w-full rounded-lg bg-[#1B2770] py-3 text-sm font-semibold text-white transition hover:bg-[#14205A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Verificando..." : "Acceder"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-3 w-full rounded-lg py-2 text-sm text-gray-500 transition hover:text-[#1B2770]"
          >
            Volver
          </button>
        </form>
      </div>
    </div>
  )
}
