import type { Election, Student, VotePayload, VoteResult } from "@/types/voting"

// ---------------------------------------------------------------------------
// Stubs — replace each function body with the real API call when the backend
// is ready. The signatures and return types must not change.
// ---------------------------------------------------------------------------

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"

// Sends a 6-digit OTP to the student's institutional email.
// POST /auth/student/request-otp
export async function requestStudentOTP(email: string): Promise<void> {
  // await fetch(`${BASE_URL}/auth/student/request-otp`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ email }),
  // })
  void BASE_URL
  void email
  await delay(600)
}

// Verifies the OTP and returns a token + student info.
// POST /auth/student/verify-otp
export async function verifyStudentOTP(
  email: string,
  code: string,
): Promise<{ token: string; student: Student }> {
  // const res = await fetch(`${BASE_URL}/auth/student/verify-otp`, {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ email, code }),
  // })
  // const data = await res.json()
  // if (!res.ok) throw new Error(data.message ?? "Código inválido")
  // return data
  void email
  void code
  await delay(600)
  return {
    token: "mock-jwt-token",
    student: {
      id: "stu-001",
      email,
      name: "Estudiante Demo",
      careerId: "addi",
      careerName: "Animación Digital y Diseño Interactivo",
    },
  }
}

// Returns the active election for the authenticated student's career.
// GET /elections/current
export async function getStudentElection(token: string): Promise<Election> {
  // const res = await fetch(`${BASE_URL}/elections/current`, {
  //   headers: { Authorization: `Bearer ${token}` },
  // })
  // const data = await res.json()
  // if (!res.ok) throw new Error(data.message ?? "Error al cargar elección")
  // return data
  void token
  await delay(400)
  return {
    id: "elec-2026",
    title: "Elecciones estudiantiles UNITEC - 2026",
    careerId: "addi",
    careerName: "Animación Digital y Diseño Interactivo",
    associations: [
      {
        id: "assoc-quaddi",
        name: "QUADDI",
        careerId: "addi",
        careerName: "Animación Digital y Diseño Interactivo",
        photoUrl: null,
        candidates: [
          { id: "c1", name: "María López", role: "Presidenta", photoUrl: null },
          { id: "c2", name: "Carlos Mejía", role: "Vicepresidente", photoUrl: null },
          { id: "c3", name: "Sofía Ramos", role: "Secretaria", photoUrl: null },
          { id: "c4", name: "Ángel Cruz", role: "Tesorero", photoUrl: null },
          { id: "c5", name: "Adriana Flores", role: "Coord. de Redes Sociales", photoUrl: null },
          { id: "c6", name: "Yariela Bustillo", role: "Coord. de Primer Ingreso", photoUrl: null },
          { id: "c7", name: "Valeria Leiva", role: "Gestora de Arte", photoUrl: null },
        ],
      },
      {
        id: "assoc-kernel",
        name: "KERNEL",
        careerId: "addi",
        careerName: "Animación Digital y Diseño Interactivo",
        photoUrl: null,
        candidates: [
          { id: "c8", name: "Luis Andrade", role: "Presidente", photoUrl: null },
          { id: "c9", name: "Diana Soto", role: "Vicepresidenta", photoUrl: null },
          { id: "c10", name: "Roberto Paz", role: "Secretario", photoUrl: null },
          { id: "c11", name: "Karla Murillo", role: "Tesorera", photoUrl: null },
        ],
      },
    ],
  }
}

// Registers the student's vote.
// POST /votes
export async function castVote(
  payload: VotePayload,
  token: string,
  electionTitle: string,
  careerName: string,
  associationName: string,
  votingTimeSeconds: number,
): Promise<VoteResult> {
  // const res = await fetch(`${BASE_URL}/votes`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${token}`,
  //   },
  //   body: JSON.stringify(payload),
  // })
  // const data = await res.json()
  // if (!res.ok) throw new Error(data.message ?? "Error al registrar voto")
  // return data
  void payload
  void token
  await delay(800)
  return { electionTitle, careerName, associationName, votingTimeSeconds }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
