import type { Club } from "../domain/types";
import type { CloudClub } from "../services/clubService";

export const isUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const toRegistrationClub = (club: CloudClub): Club => ({
  clubId: club.id,
  name: club.name,
  shortName: club.short_name ?? "",
  city: club.city ?? "",
  contactName: club.contact_name ?? "",
  contactEmail: club.contact_email ?? "",
  website: club.website ?? "",
  logoUrl: club.logo_url ?? "",
  primaryColor: club.primary_color ?? "#00B4D8",
  secondaryColor: club.secondary_color ?? "#0077B6",
  status: club.status,
  createdAt: club.created_at,
  updatedAt: club.updated_at,
});

export const getActiveRegistrationClubs = (clubs: Club[]): Club[] =>
  clubs
    .filter((club) => club.status === "active")
    .sort((left, right) => left.name.localeCompare(right.name, "de-DE"));

export const resolveRegistrationClubSelection = (
  clubs: Club[],
  clubId: string,
  fallbackName = "",
): { clubId: string; club: string; isCanonicalCloudClub: boolean } => {
  const selectedClub = clubs.find((club) => club.clubId === clubId);
  const selectedClubId = selectedClub?.clubId ?? clubId.trim();
  const selectedClubName = selectedClub?.name.trim() || fallbackName.trim();

  return {
    clubId: selectedClubId,
    club: selectedClubName,
    isCanonicalCloudClub: isUuid(selectedClubId),
  };
};
