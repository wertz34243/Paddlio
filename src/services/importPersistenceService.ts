import type { PaddleMotionData, User } from "../domain/types";
import type { ImportType } from "../features/importExport/types";
import { toCloudUuidOrNull } from "./cloudIds";
import { upsertCloudCompetition } from "./competitionService";
import { upsertCloudCompetitionStartEntry } from "./competitionStartService";
import { upsertCloudJournalEntry } from "./journalService";
import { upsertCloudMaterial } from "./materialService";
import { upsertCloudTraining } from "./trainingService";
import { upsertCloudImportedClubMember } from "./importedClubMemberService";
import { runCloudWrite } from "./cloudWriteService";

const addedItems = <T extends { id: string }>(before: T[], after: T[]): T[] => {
  const existingIds = new Set(before.map((item) => item.id));
  return after.filter((item) => !existingIds.has(item.id));
};

export async function persistImportedEntities(
  importType: ImportType,
  before: PaddleMotionData,
  after: PaddleMotionData,
  user: User,
  cloudClubId?: string | null,
): Promise<number> {
  if (importType === "athletes" || importType === "club_members") {
    const clubId = toCloudUuidOrNull(cloudClubId);
    if (!clubId) throw new Error("Für den Mitgliederimport ist ein gültiger Cloud-Verein erforderlich.");
    const items = addedItems(before.coachAthletes, after.coachAthletes);
    await Promise.all(items.map((item) => upsertCloudImportedClubMember({
      id: item.id,
      clubId,
      importedBy: user.userId,
      firstName: item.firstName,
      lastName: item.lastName,
      displayName: item.name,
      email: item.email,
      birthDate: item.birthDate,
      ageCategory: item.ageClass,
      boatClasses: item.boatClasses.filter((boat): boat is "K1" | "C1" => boat === "K1" || boat === "C1"),
      memberKind: importType === "athletes" ? "athlete" : "club_member",
      status: "pending",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    })));
    return items.length;
  }
  if (importType === "training_plans") {
    const items = addedItems(before.plan, after.plan);
    await Promise.all(items.map((item) => upsertCloudTraining(item)));
    return items.length;
  }
  if (importType === "training_sessions") {
    const items = addedItems(before.journal, after.journal);
    await Promise.all(items.map((item) => upsertCloudJournalEntry(item)));
    return items.length;
  }
  if (importType === "competition_results") {
    const items = addedItems(before.competitions, after.competitions);
    const clubId = toCloudUuidOrNull(cloudClubId);
    await Promise.all(items.map((item) => upsertCloudCompetition({ ...item, clubId: clubId ?? "" }, clubId ?? undefined)));
    return items.length;
  }
  if (importType === "start_lists") {
    const items = addedItems(before.competitionStartEntries, after.competitionStartEntries);
    const clubId = toCloudUuidOrNull(cloudClubId);
    await Promise.all(items.map((item) => upsertCloudCompetitionStartEntry({ ...item, clubId: clubId ?? "" })));
    return items.length;
  }
  if (importType === "materials") {
    const items = addedItems(before.material, after.material);
    await Promise.all(items.map((item) => upsertCloudMaterial(item)));
    return items.length;
  }
  if (importType === "groups") {
    const items = addedItems(before.coachGroups, after.coachGroups);
    await Promise.all(items.map((item) => {
      const payload = {
      id: item.id,
      club_id: toCloudUuidOrNull(cloudClubId) ?? toCloudUuidOrNull(item.clubId),
      coach_id: user.userId,
      name: item.name,
      description: item.description,
      age_category: item.ageCategory || null,
      boat_classes: item.boatClasses,
      training_focus: item.trainingFocus,
      color: item.color,
      status: item.status,
      };
      return runCloudWrite("training_groups", "upsert", payload, (client) =>
        (client.from("training_groups") as any).upsert(payload, { onConflict: "id" }));
    }));
    return items.length;
  }
  return 0;
}
