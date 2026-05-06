import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { UnitecLogo } from "@/components/UnitecLogo"
import { useVoting } from "@/context/VotingContext"
import { requestStudentOTP } from "@/services/voting.service"

export default function StudentLoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { setEmail: saveEmail } = useVoting()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setLoading(true)
    setError("")

    try {
      await requestStudentOTP(trimmed)
      saveEmail(trimmed)
      navigate("/student/verificar")
    } catch {
      setError("No se pudo enviar el código. Verifica tu correo institucional.")
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
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[#1B2770]"
          >
            Correo institucional
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="estudiante@unitec.edu.hn"
            autoComplete="email"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#1B2770] focus:ring-2 focus:ring-[#1B2770]/20"
          />

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="mt-6 w-full rounded-lg bg-[#1B2770] py-3 text-sm font-semibold text-white transition hover:bg-[#14205A] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Enviando código..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  )
}
