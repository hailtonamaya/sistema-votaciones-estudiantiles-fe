import type { ApiAssociation } from "@/services/admin.service"
import type { Association, Candidate } from "@/types/voting"

export function mapApiAssociation(
  a: ApiAssociation,
  careerName: string
): Association {
  return {
    id: a.association_id,
    name: a.name,
    careerId: a.election_career?.career_id ?? "",
    careerName,
    photoUrl: a.logo_url,
    candidates: (a.association_member ?? []).map(
      (m): Candidate => ({
        id: m.association_member_id,
        name: m.full_name,
        role: m.role ?? "Miembro",
        photoUrl: m.photo_url,
      })
    ),
  }
}
