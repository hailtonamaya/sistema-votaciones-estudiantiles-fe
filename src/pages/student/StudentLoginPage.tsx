import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { UnitecLogo } from "@/components/UnitecLogo"
import { useVoting } from "@/context/VotingContext"
import { requestStudentOTP } from "@/services/voting.service"
import { BRAND } from "@/lib/brand"

export default function StudentLoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { setEmail: saveEmail } = useVoting()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || loading) return

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-light px-4">
      <div className="mb-8">
        <UnitecLogo size="lg" />
      </div>

      <h1 className="mb-8 text-xl font-bold sm:text-2xl" style={{ color: BRAND }}>
        Inicio de Sesión Estudiantil
      </h1>

      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium"
            style={{ color: BRAND }}
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
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-brand/20"
          />

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="mt-6 w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: BRAND }}
          >
            {loading ? "Enviando código..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  )
}
