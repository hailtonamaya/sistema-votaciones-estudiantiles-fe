import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { UnitecLogo } from "@/components/UnitecLogo"
import { OTPInput } from "@/components/student/OTPInput"
import { useVoting } from "@/context/VotingContext"
import { verifyStudentOTP, getStudentElection } from "@/services/voting.service"

export default function StudentOTPPage() {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { email, setAuth, setElection, startVoting } = useVoting()

  if (!email) {
    navigate("/student/login")
    return null
  }

  const code = digits.join("")
  const complete = code.length === 6 && digits.every(Boolean)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!complete || loading) return

    setLoading(true)
    setError("")

    let token = ""
    try {
      const auth = await verifyStudentOTP(email!, code)
      token = auth.token
      setAuth(auth.token, auth.student)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Código incorrecto o expirado. Inténtalo de nuevo.",
      )
      setLoading(false)
      return
    }

    try {
      const election = await getStudentElection(token)
      setElection(election)
      startVoting()
      navigate("/student/votar")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la elección.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#EDF0F5] px-4">
      <div className="mb-8">
        <UnitecLogo size="lg" />
      </div>

      <h1 className="mb-8 text-2xl font-bold text-[#1B2770]">
        Inicio de Sesión Estudiantil
      </h1>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} noValidate>
          <p className="mb-4 text-center text-sm text-[#1B2770]">
            Hemos enviado un código de 6 dígitos a tu correo.
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
            {loading ? "Verificando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  )
}
