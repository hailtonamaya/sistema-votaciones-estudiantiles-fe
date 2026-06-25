import { useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { UnitecLogo } from "@/components/UnitecLogo"
import { useAuth } from "@/context/AuthContext"
import { checkVoterStatus, requestOTP } from "@/services/voting.service"
import { BRAND } from "@/lib/brand"
import { CheckCircle2, ClockIcon } from "lucide-react"

type BlockedReason = "no_election" | "already_voted"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [blocked, setBlocked] = useState<BlockedReason | null>(null)
  const navigate = useNavigate()
  const { setPendingEmail } = useAuth()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError("")

    try {
      const status = await checkVoterStatus(trimmed)
      if (!status.proceed && status.reason) {
        setBlocked(status.reason)
        return
      }
      await requestOTP(trimmed)
      setPendingEmail(trimmed)
      navigate("/login/otp")
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar el código. Verifica tu correo institucional.",
      )
    } finally {
      setLoading(false)
    }
  }

  if (blocked === "no_election") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-bg-light px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="flex justify-center mb-5">
            <UnitecLogo size="lg" />
          </div>
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "#FEF9C3" }}
          >
            <ClockIcon size={26} style={{ color: "#A16207" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: BRAND }}>
            Sin elección activa
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Actualmente no hay ninguna elección activa habilitada para tu carrera.
          </p>
          <p className="mt-3 text-xs text-gray-400">
            Cuando haya una elección disponible podrás acceder desde aquí.
          </p>
          <button
            onClick={() => { setBlocked(null); setEmail("") }}
            className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Volver
          </button>
        </div>
      </main>
    )
  }

  if (blocked === "already_voted") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-bg-light px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm text-center">
          <div className="flex justify-center mb-5">
            <UnitecLogo size="lg" />
          </div>
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "#DCFCE7" }}
          >
            <CheckCircle2 size={26} style={{ color: "#16A34A" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: BRAND }}>
            Voto ya registrado
          </h2>
          <p className="mt-2 text-sm text-gray-500 leading-relaxed">
            Ya emitiste tu voto en la elección activa. Solo se permite un voto por estudiante.
          </p>
          <p className="mt-3 text-xs text-gray-400">
            Si crees que esto es un error, contacta a la administración.
          </p>
          <button
            onClick={() => { setBlocked(null); setEmail("") }}
            className="mt-6 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: BRAND }}
          >
            Volver
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg-light px-4">
      <div className="mb-8">
        <UnitecLogo size="lg" />
      </div>

      <h1 className="mb-2 text-xl font-bold sm:text-2xl" style={{ color: BRAND }}>
        Sistema de Votaciones Estudiantiles
      </h1>
      <p className="mb-8 text-sm text-gray-500">Inicio de Sesión</p>

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
            placeholder="usuario@unitec.edu.hn"
            autoComplete="email"
            className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="mt-6 w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: BRAND }}
          >
            {loading ? "Verificando..." : "Continuar"}
          </button>
        </form>
      </div>
    </main>
  )
}
