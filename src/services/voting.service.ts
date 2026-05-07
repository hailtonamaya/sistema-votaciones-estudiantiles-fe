import { api } from "@/lib/api"
import type { Election, Student, VotePayload, VoteResult } from "@/types/voting"

interface VerifyOtpResponse {
  token: string
  user: {
    user_id: string
    email: string
    full_name: string
    role: string
  }
}

interface CurrentElectionResponse {
  data: {
    election_id: string
    title: string
    description: string | null
    start_at: string | null
    end_at: string | null
    career_id: string
    career_name: string
    career_code: string
    has_voted: boolean
    associations: Array<{
      association_id: string
      name: string
      description: string | null
      logo_url: string | null
      association_member: Array<{
        association_member_id: string
        full_name: string
        role: string | null
        photo_url: string | null
      }>
    }>
  } | null
}

interface CastBallotResponse {
  data: {
    ballot_hash: string
    submitted_at: string
  }
}

export async function requestStudentOTP(email: string): Promise<void> {
  await api<{ ok: boolean; message: string }>("/auth/request-otp", {
    method: "POST",
    body: { email },
  })
}

export async function verifyStudentOTP(
  email: string,
  code: string,
): Promise<{ token: string; student: Student }> {
  const data = await api<VerifyOtpResponse>("/auth/verify-otp", {
    method: "POST",
    body: { email, code },
  })

  return {
    token: data.token,
    student: {
      id: data.user.user_id,
      email: data.user.email,
      name: data.user.full_name,
      careerId: "",
      careerName: "",
    },
  }
}

export async function getStudentElection(token: string): Promise<Election> {
  const res = await api<CurrentElectionResponse>("/elections/me/current", { token })
  if (!res.data) {
    throw new Error("No tienes ninguna elección activa habilitada para tu carrera.")
  }
  const e = res.data
  return {
    id: e.election_id,
    title: e.title,
    careerId: e.career_id,
    careerName: e.career_name,
    associations: e.associations.map((a) => ({
      id: a.association_id,
      name: a.name,
      careerId: e.career_id,
      careerName: e.career_name,
      photoUrl: a.logo_url,
      candidates: a.association_member.map((m) => ({
        id: m.association_member_id,
        name: m.full_name,
        role: m.role ?? "",
        photoUrl: m.photo_url,
      })),
    })),
  }
}

export async function castVote(
  payload: VotePayload,
  token: string,
  electionTitle: string,
  careerName: string,
  associationName: string,
  votingTimeSeconds: number,
): Promise<VoteResult> {
  const isBlank = payload.associationId === null
  await api<CastBallotResponse>("/ballots", {
    method: "POST",
    token,
    body: {
      election_id: payload.electionId,
      association_id: isBlank ? undefined : payload.associationId,
      is_blank: isBlank,
    },
  })

  return { electionTitle, careerName, associationName, votingTimeSeconds }
}
