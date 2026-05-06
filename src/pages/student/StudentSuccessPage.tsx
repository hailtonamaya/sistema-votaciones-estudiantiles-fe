import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { UnitecLogo } from "@/components/UnitecLogo"
import { useVoting } from "@/context/VotingContext"

const AUTO_CLOSE_SECONDS = 30

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} segundo${seconds !== 1 ? "s" : ""}`
  if (seconds === 0) return `${minutes} minuto${minutes !== 1 ? "s" : ""}`
  return `${minutes} minuto${minutes !== 1 ? "s" : ""} y ${seconds} segundo${seconds !== 1 ? "s" : ""}`
}

export default function StudentSuccessPage() {
  const [countdown, setCountdown] = useState(AUTO_CLOSE_SECONDS)
  const navigate = useNavigate()
  const { voteResult, reset } = useVoting()

  if (!voteResult) {
    navigate("/student/login")
    return null
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id)
          reset()
          navigate("/student/login")
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [navigate, reset])

  function handleFinish() {
    reset()
    navigate("/student/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EDF0F5] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-sm">
        <div className="flex justify-center">
          <UnitecLogo size="lg" />
        </div>

        <h1 className="mt-8 text-center text-2xl font-bold text-[#1B2770]">
          ¡Voto Registrado!
        </h1>

        <div className="mt-6 space-y-1 text-sm text-[#1B2770]">
          <p className="font-semibold">Resumen de votación</p>
          <p>Carrera: {voteResult.careerName}</p>
          <p>Asociación: {voteResult.associationName}</p>
          <p>Tiempo de votación: {formatTime(voteResult.votingTimeSeconds)}</p>
        </div>

        <button
          onClick={handleFinish}
          className="mt-8 w-full rounded-lg bg-[#1B2770] py-3 text-sm font-semibold text-white transition hover:bg-[#14205A]"
        >
          Finalizar
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          La sesión se cerrará automáticamente en {countdown} segundos
        </p>
      </div>
    </div>
  )
}
