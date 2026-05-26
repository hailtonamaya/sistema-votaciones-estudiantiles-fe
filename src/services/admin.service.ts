import { api } from "@/lib/api"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ElectionStatus = "draft" | "scheduled" | "open" | "closed" | "cancelled"

export interface ApiElection {
  election_id: string
  organization_id: string
  title: string
  description: string | null
  status: ElectionStatus
  start_at: string | null
  end_at: string | null
  created_at: string
  organization?: { name: string; code: string } | null
}

export interface ApiOrganization {
  organization_id: string
  name: string
  code: string
  location: string | null
  is_active: boolean
  created_at: string
}

export interface ApiCareer {
  career_id: string
  organization_id: string
  name: string
  code: string
  min_votes_required: number
  created_at: string
  organization?: { name: string; code: string } | null
}

export interface ApiUser {
  user_id: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
}

// ─── Elections ────────────────────────────────────────────────────────────────

export const listElections = (token: string, status?: string): Promise<ApiElection[]> =>
  api<{ data: ApiElection[] }>(`/elections${status ? `?status=${status}` : ""}`, { token })
    .then((r) => r.data)

export const createElection = (
  token: string,
  body: { organization_id: string; title: string; description?: string; start_at?: string; end_at?: string },
): Promise<ApiElection> =>
  api<{ data: ApiElection }>("/elections", { method: "POST", token, body }).then((r) => r.data)

export const updateElection = (
  token: string,
  id: string,
  body: Partial<{ organization_id: string; title: string; description: string; start_at: string; end_at: string }>,
): Promise<ApiElection> =>
  api<{ data: ApiElection }>(`/elections/${id}`, { method: "PATCH", token, body }).then((r) => r.data)

export const deleteElection = (token: string, id: string): Promise<void> =>
  api<void>(`/elections/${id}`, { method: "DELETE", token })

export const transitionElection = (token: string, id: string, status: ElectionStatus): Promise<ApiElection> =>
  api<{ data: ApiElection }>(`/elections/${id}/transition`, { method: "POST", token, body: { status } }).then((r) => r.data)

// ─── Organizations (campus) ───────────────────────────────────────────────────

export const listOrganizations = (token: string): Promise<ApiOrganization[]> =>
  api<{ data: ApiOrganization[] }>("/organizations", { token }).then((r) => r.data)

export const createOrganization = (
  token: string,
  body: { name: string; code: string; location: string },
): Promise<ApiOrganization> =>
  api<{ data: ApiOrganization }>("/organizations", { method: "POST", token, body }).then((r) => r.data)

export const updateOrganization = (
  token: string,
  id: string,
  body: Partial<{ name: string; code: string; location: string; is_active: boolean }>,
): Promise<ApiOrganization> =>
  api<{ data: ApiOrganization }>(`/organizations/${id}`, { method: "PATCH", token, body }).then((r) => r.data)

export const deleteOrganization = (token: string, id: string): Promise<void> =>
  api<void>(`/organizations/${id}`, { method: "DELETE", token })

// ─── Careers ──────────────────────────────────────────────────────────────────

export const listCareers = (token: string): Promise<ApiCareer[]> =>
  api<{ data: ApiCareer[] }>("/careers", { token }).then((r) => r.data)

export const createCareer = (
  token: string,
  body: { name: string; code: string; organization_id: string; min_votes_required: number },
): Promise<ApiCareer> =>
  api<{ data: ApiCareer }>("/careers", { method: "POST", token, body }).then((r) => r.data)

export const updateCareer = (
  token: string,
  id: string,
  body: Partial<{ name: string; code: string; organization_id: string; min_votes_required: number }>,
): Promise<ApiCareer> =>
  api<{ data: ApiCareer }>(`/careers/${id}`, { method: "PATCH", token, body }).then((r) => r.data)

export const deleteCareer = (token: string, id: string): Promise<void> =>
  api<void>(`/careers/${id}`, { method: "DELETE", token })

// ─── Associations ─────────────────────────────────────────────────────────────

export interface ApiAssociationMember {
  association_member_id: string
  association_id?: string
  full_name: string
  role: string | null
  photo_url: string | null
}

export interface ApiAssociation {
  association_id: string
  election_career_id: string
  name: string
  description: string | null
  logo_url: string | null
  association_member?: ApiAssociationMember[]
  election_career?: {
    election_id: string
    career_id: string
    career?: { career_id: string; name: string; code: string } | null
  } | null
}

export const listAssociations = (token: string, params: { election_id?: string; election_career_id?: string } = {}): Promise<ApiAssociation[]> => {
  const qs = new URLSearchParams()
  if (params.election_id) qs.set('election_id', params.election_id)
  if (params.election_career_id) qs.set('election_career_id', params.election_career_id)
  return api<{ data: ApiAssociation[] }>(`/associations${qs.toString() ? `?${qs}` : ''}`, { token }).then((r) => r.data)
}

export const createAssociation = (
  token: string,
  body: { election_id: string; career_id: string; name: string; description?: string; logo_url?: string },
): Promise<ApiAssociation> =>
  api<{ data: ApiAssociation }>('/associations', { method: 'POST', token, body }).then((r) => r.data)

export const deleteAssociation = (token: string, id: string): Promise<void> =>
  api<void>(`/associations/${id}`, { method: 'DELETE', token })

export const createAssociationMember = (
  token: string,
  associationId: string,
  body: { full_name: string; role?: string; photo_url?: string },
): Promise<ApiAssociationMember> =>
  api<{ data: ApiAssociationMember }>(`/associations/${associationId}/members`, { method: 'POST', token, body }).then((r) => r.data)

export const deleteAssociationMember = (token: string, associationId: string, memberId: string): Promise<void> =>
  api<void>(`/associations/${associationId}/members/${memberId}`, { method: 'DELETE', token })

// ─── Voters ───────────────────────────────────────────────────────────────────

export interface ApiVoter {
  election_voter_id: string
  election_id: string
  student_id: string
  career_id: string
  has_voted: boolean
  voted_at?: string | null
  full_name?: string
  institutional_id?: string
  email?: string
  student?: { institutional_id: string; user?: { email: string; full_name: string } | null } | null
  career?: { career_id: string; name: string; code: string } | null
}

export const listVoters = (token: string, electionId: string): Promise<ApiVoter[]> =>
  api<{ data: ApiVoter[] }>(`/voters?election_id=${electionId}`, { token }).then((r) => r.data)

export const createVoter = (
  token: string,
  body: { election_id: string; career_id: string; full_name: string; institutional_id: string; email: string },
): Promise<ApiVoter> =>
  api<{ data: ApiVoter }>('/voters', { method: 'POST', token, body }).then((r) => r.data)

export const deleteVoter = (token: string, id: string): Promise<void> =>
  api<void>(`/voters/${id}`, { method: 'DELETE', token })

// ─── Users ────────────────────────────────────────────────────────────────────

export const listAdminUsers = (token: string): Promise<ApiUser[]> =>
  api<{ data: ApiUser[] }>("/users", { token }).then((r) => r.data)

export const createAdminUser = (
  token: string,
  body: { full_name: string; email: string; role: string },
): Promise<ApiUser> =>
  api<{ data: ApiUser }>("/users", { method: "POST", token, body }).then((r) => r.data)

export const updateAdminUser = (
  token: string,
  id: string,
  body: Partial<{ full_name: string; email: string; role: string; is_active: boolean }>,
): Promise<ApiUser> =>
  api<{ data: ApiUser }>(`/users/${id}`, { method: "PATCH", token, body }).then((r) => r.data)

export const deleteAdminUser = (token: string, id: string): Promise<void> =>
  api<void>(`/users/${id}`, { method: "DELETE", token })
