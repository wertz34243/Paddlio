import type { CoachAthlete } from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { runCloudWrite } from "./cloudWriteService";

export type ImportedClubMember = {
  id: string;
  clubId: string;
  importedBy: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  birthDate: string;
  ageCategory: string;
  boatClasses: Array<"K1" | "C1">;
  memberKind: "athlete" | "club_member";
  status: "pending" | "invited" | "linked" | "inactive";
  createdAt: string;
  updatedAt: string;
};

const toPayload = (member: ImportedClubMember) => ({
  id: member.id,
  club_id: member.clubId,
  imported_by: member.importedBy,
  first_name: member.firstName || null,
  last_name: member.lastName || null,
  display_name: member.displayName,
  email: member.email || null,
  birth_date: member.birthDate || null,
  age_category: member.ageCategory || null,
  boat_classes: member.boatClasses,
  member_kind: member.memberKind,
  status: member.status,
  created_at: member.createdAt,
  updated_at: member.updatedAt,
});

export const upsertCloudImportedClubMember = async (member: ImportedClubMember): Promise<void> => {
  const payload = toPayload(member);
  await runCloudWrite("imported_club_members", "upsert", payload, (client) =>
    (client.from("imported_club_members") as any).upsert(payload));
};

export const listCloudImportedClubMembers = async (): Promise<ImportedClubMember[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from("imported_club_members") as any)
    .select("*")
    .neq("status", "inactive")
    .order("display_name");
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    clubId: row.club_id,
    importedBy: row.imported_by,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    displayName: row.display_name,
    email: row.email ?? "",
    birthDate: row.birth_date ?? "",
    ageCategory: row.age_category ?? "",
    boatClasses: (row.boat_classes ?? []).filter((boat: string): boat is "K1" | "C1" => boat === "K1" || boat === "C1"),
    memberKind: row.member_kind,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
};

export const importedMemberToCoachAthlete = (member: ImportedClubMember, clubName = ""): CoachAthlete => ({
  id: member.id,
  coachUserId: member.importedBy,
  clubId: member.clubId,
  firstName: member.firstName,
  lastName: member.lastName,
  email: member.email,
  name: member.displayName,
  birthDate: member.birthDate,
  ageClass: member.ageCategory as CoachAthlete["ageClass"],
  club: clubName,
  boatClasses: member.boatClasses,
  paddleSide: "rechts",
  groupId: "",
  groupIds: [],
  goals: "",
  trainerNotes: "",
  notes: member.memberKind === "club_member" ? "Importiertes Vereinsmitglied" : "Importierter Sportler",
  status: member.status === "inactive" ? "pausiert" : "aktiv",
  invitationStatus: member.status === "linked" ? "aktiv" : "einladung_offen",
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
});
