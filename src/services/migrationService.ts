import type { PaddleMotionData } from "../domain/types";
import { updateCloudProfile, type CloudProfile } from "./profileService";
import { upsertCloudTraining, upsertCloudFeedback } from "./trainingService";
import { upsertCloudTrainingTemplate } from "./trainingTemplateService";
import { upsertCloudGoal } from "./goalService";
import { upsertCloudCompetition } from "./competitionService";
import { upsertCloudMaterial } from "./materialService";
import { upsertCloudSmartCoachRecommendation } from "./smartCoachService";
import {
  upsertCloudClubBoat,
  upsertCloudClubDocument,
  upsertCloudClubEvent,
  upsertCloudClubMaterial,
  upsertCloudClubMessage,
  upsertCloudClubSettings,
} from "./clubPortalService";
import {
  upsertCloudClubPost,
  upsertCloudDirectMessage,
  upsertCloudFileAttachment,
  upsertCloudGroupMessage,
  upsertCloudTask,
  upsertCloudTaskAssignment,
  upsertCloudTrainingAttendance,
} from "./communicationService";

const migrationKey = (userId: string): string => `paddlio_cloud_migration_${userId}`;

export const isCloudMigrationCompleted = (userId: string): boolean =>
  window.localStorage.getItem(migrationKey(userId)) === "true";

export const markCloudMigrationCompleted = (userId: string): void => {
  window.localStorage.setItem(migrationKey(userId), "true");
};

export const migrateLocalDataToCloud = async (userId: string, data: PaddleMotionData, profile: CloudProfile, clubId?: string): Promise<number> => {
  if (isCloudMigrationCompleted(userId)) return 0;
  const migrated = await syncDataSnapshotToCloud(data, profile, clubId);
  markCloudMigrationCompleted(userId);
  return migrated;
};

export const syncDataSnapshotToCloud = async (data: PaddleMotionData, profile: CloudProfile, clubId?: string): Promise<number> => {
  let migrated = 0;

  await updateCloudProfile({
    id: profile.id,
    first_name: data.users[0]?.profile.firstName,
    last_name: data.users[0]?.profile.lastName,
    display_name: data.users[0]?.profile.nickname || data.athlete.name,
    avatar_url: data.users[0]?.profile.profileImageDataUrl || null,
    age_category: data.users[0]?.profile.ageClass || null,
    boat_classes: data.users[0]?.profile.boatClasses ?? ["K1"],
    paddle_side: data.users[0]?.profile.paddleSide === "links" ? "Links" : "Rechts",
  });
  migrated += 1;

  for (const entry of data.plan) {
    await upsertCloudTraining({ ...entry, ownerUserId: entry.ownerUserId || profile.id, clubId: entry.clubId || clubId || "" });
    migrated += 1;
  }
  for (const feedback of data.trainingFeedback) {
    await upsertCloudFeedback(feedback);
    migrated += 1;
  }
  for (const template of data.trainingTemplates) {
    await upsertCloudTrainingTemplate({ ...template, ownerUserId: template.ownerUserId || profile.id, clubId: template.clubId || clubId });
    migrated += 1;
  }
  for (const goal of data.goals) {
    await upsertCloudGoal(goal);
    migrated += 1;
  }
  for (const competition of data.competitions) {
    await upsertCloudCompetition(competition, clubId);
    migrated += 1;
  }
  for (const material of data.material) {
    await upsertCloudMaterial(material);
    migrated += 1;
  }
  for (const recommendation of data.smartCoachRecommendations) {
    await upsertCloudSmartCoachRecommendation(recommendation);
    migrated += 1;
  }
  for (const item of data.clubMaterial) {
    await upsertCloudClubMaterial(item);
    migrated += 1;
  }
  for (const boat of data.clubBoats) {
    await upsertCloudClubBoat(boat);
    migrated += 1;
  }
  for (const event of data.clubEvents) {
    await upsertCloudClubEvent(event);
    migrated += 1;
  }
  for (const document of data.clubDocuments) {
    await upsertCloudClubDocument(document);
    migrated += 1;
  }
  for (const message of data.clubMessages) {
    await upsertCloudClubMessage(message);
    migrated += 1;
  }
  for (const settings of data.clubSettings) {
    await upsertCloudClubSettings(settings);
    migrated += 1;
  }
  for (const message of data.directMessages) {
    await upsertCloudDirectMessage(message);
    migrated += 1;
  }
  for (const message of data.groupMessages) {
    await upsertCloudGroupMessage(message);
    migrated += 1;
  }
  for (const post of data.clubPosts) {
    await upsertCloudClubPost(post);
    migrated += 1;
  }
  for (const task of data.tasks) {
    await upsertCloudTask(task);
    migrated += 1;
  }
  for (const assignment of data.taskAssignments) {
    await upsertCloudTaskAssignment(assignment);
    migrated += 1;
  }
  for (const attendance of data.trainingAttendance) {
    await upsertCloudTrainingAttendance(attendance);
    migrated += 1;
  }
  for (const attachment of data.fileAttachments) {
    await upsertCloudFileAttachment(attachment);
    migrated += 1;
  }

  return migrated;
};
