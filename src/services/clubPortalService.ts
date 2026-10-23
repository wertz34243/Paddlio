import type { ClubBoat, ClubDocument, ClubEvent, ClubMaterial, ClubMessage, ClubSettings } from "../domain/types";
import { getSupabaseClient } from "../lib/supabase";
import { sanitizeCloudPayload } from "./cloudIds";
import { runCloudWrite } from "./cloudWriteService";
import { dateKeyFromLocalDate, localTimeInputValue } from "../lib/dateOnly";

const fromClubMaterial = (row: any): ClubMaterial => ({
  id: row.id,
  clubId: row.club_id,
  inventoryNumber: row.inventory_number ?? "",
  category: row.category ?? "Vereinsmaterial",
  name: row.name,
  condition: row.condition ?? "",
  ownerUserId: row.owner_id ?? "",
  ownerName: row.owner_name ?? "",
  photoUrl: row.photo_url ?? "",
  lastInspectionDate: row.last_check ?? "",
  remark: row.note ?? "",
  status: row.status ?? "active",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toClubMaterial = (item: ClubMaterial) => ({
  id: item.id,
  club_id: item.clubId,
  inventory_number: item.inventoryNumber,
  category: item.category,
  name: item.name,
  condition: item.condition,
  owner_id: item.ownerUserId || null,
  owner_name: item.ownerName,
  photo_url: item.photoUrl,
  last_check: item.lastInspectionDate || null,
  note: item.remark,
  status: item.status,
});

const fromClubBoat = (row: any): ClubBoat => ({
  id: row.id,
  clubId: row.club_id,
  manufacturer: row.manufacturer ?? "",
  model: row.model ?? "",
  boatClass: row.boat_class ?? "K1",
  lengthCm: row.length_cm ?? 0,
  weightKg: row.weight_kg ?? 0,
  buildYear: row.build_year ?? 0,
  ownerUserId: row.owner_id ?? "",
  ownerName: row.owner_name ?? "",
  isClubBoat: Boolean(row.is_club_boat),
  linkedAthleteIds: row.linked_athlete_ids ?? [],
  status: row.status ?? "active",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toClubBoat = (item: ClubBoat) => ({
  id: item.id,
  club_id: item.clubId,
  manufacturer: item.manufacturer,
  model: item.model,
  boat_class: item.boatClass,
  length_cm: item.lengthCm || null,
  weight_kg: item.weightKg || null,
  build_year: item.buildYear || null,
  owner_id: item.ownerUserId || null,
  owner_name: item.ownerName,
  is_club_boat: item.isClubBoat,
  linked_athlete_ids: item.linkedAthleteIds,
  status: item.status,
});

const fromClubEvent = (row: any): ClubEvent => ({
  id: row.id,
  clubId: row.club_id,
  title: row.title,
  date: row.date ?? (row.starts_at ? dateKeyFromLocalDate(new Date(row.starts_at)) : ""),
  time: row.time?.slice(0, 5) ?? (row.starts_at ? localTimeInputValue(new Date(row.starts_at)) : ""),
  category: row.category ?? "training",
  groupId: row.group_id ?? "",
  trainerUserId: row.trainer_user_id ?? "",
  athleteUserId: row.athlete_user_id ?? "",
  note: row.note ?? row.description ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toClubEvent = (item: ClubEvent) => ({
  id: item.id,
  club_id: item.clubId,
  title: item.title,
  date: item.date,
  time: item.time || null,
  category: item.category,
  group_id: item.groupId || null,
  trainer_user_id: item.trainerUserId || null,
  athlete_user_id: item.athleteUserId || null,
  note: item.note,
});

const fromClubDocument = (row: any): ClubDocument => ({
  id: row.id,
  clubId: row.club_id,
  folder: row.folder ?? "Formulare",
  title: row.title,
  fileName: row.file_name ?? "",
  fileUrl: row.file_path ?? "",
  mimeType: row.mime_type ?? "",
  visibleForRoles: row.visible_for_roles ?? [],
  uploadedByUserId: row.created_by ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toClubDocument = (item: ClubDocument) => ({
  id: item.id,
  club_id: item.clubId,
  folder: item.folder,
  title: item.title,
  file_name: item.fileName,
  file_path: item.fileUrl,
  mime_type: item.mimeType,
  visibility: "club",
  visible_for_roles: item.visibleForRoles,
  created_by: item.uploadedByUserId || null,
});

const fromClubMessage = (row: any): ClubMessage => ({
  id: row.id,
  clubId: row.club_id,
  senderUserId: row.sender_id,
  audience: row.target_type ?? "club",
  groupId: row.target_group_id ?? "",
  recipientUserId: row.target_user_id ?? "",
  title: row.title,
  body: row.message ?? "",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toClubMessage = (item: ClubMessage) => ({
  id: item.id,
  club_id: item.clubId,
  sender_id: item.senderUserId,
  target_type: item.audience,
  target_group_id: item.audience === "group" ? item.groupId || null : null,
  target_user_id: item.audience === "athlete" ? item.recipientUserId || null : null,
  title: item.title,
  message: item.body,
});

const fromClubSettings = (record: any): ClubSettings => {
  const row = record.value ?? {};
  return ({
  clubId: record.club_id,
  logoUrl: row.logo_url ?? "",
  primaryColor: row.primary_color ?? "#00B4D8",
  secondaryColor: row.secondary_color ?? "#0077B6",
  address: row.address ?? "",
  homepage: row.homepage ?? "",
  contactName: row.contact_name ?? "",
  contactEmail: row.contact_email ?? "",
  clubNumber: row.club_number ?? "",
  imprint: row.imprint ?? "",
  updatedAt: record.updated_at,
});
};

const toClubSettings = (item: ClubSettings) => ({
  id: item.clubId,
  club_id: item.clubId,
  name: "portal",
  value: {
  logo_url: item.logoUrl,
  primary_color: item.primaryColor,
  secondary_color: item.secondaryColor,
  address: item.address,
  homepage: item.homepage,
  contact_name: item.contactName,
  contact_email: item.contactEmail,
  club_number: item.clubNumber,
  imprint: item.imprint,
  },
});

const listTable = async <T,>(table: string, mapper: (row: any) => T): Promise<T[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from(table) as any).select("*");
  if (error) throw error;
  return (data ?? []).map(mapper);
};

const upsertTable = async (table: string, payload: Record<string, unknown>): Promise<void> => {
  const cloudPayload = sanitizeCloudPayload(payload);
  await runCloudWrite(table, "upsert", cloudPayload, (client) =>
    (client.from(table) as any).upsert(cloudPayload, { onConflict: "id" }));
};

export const listCloudClubMaterial = () => listTable("club_material", fromClubMaterial);
export const listCloudClubBoats = () => listTable("boats", fromClubBoat);
export const listCloudClubEvents = () => listTable("club_events", fromClubEvent);
export const listCloudClubDocuments = () => listTable("club_documents", fromClubDocument);
export const listCloudClubMessages = () => listTable("club_messages", fromClubMessage);
export const listCloudClubSettings = async (): Promise<ClubSettings[]> => {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await (client.from("club_settings") as any).select("*").eq("name", "portal");
  if (error) throw error;
  return (data ?? []).map(fromClubSettings);
};

export const upsertCloudClubMaterial = (item: ClubMaterial) => upsertTable("club_material", toClubMaterial(item));
export const upsertCloudClubBoat = (item: ClubBoat) => upsertTable("boats", toClubBoat(item));
export const upsertCloudClubEvent = (item: ClubEvent) => upsertTable("club_events", toClubEvent(item));
export const upsertCloudClubDocument = (item: ClubDocument) => upsertTable("club_documents", toClubDocument(item));
export const upsertCloudClubMessage = (item: ClubMessage) => upsertTable("club_messages", toClubMessage(item));
export const upsertCloudClubSettings = (item: ClubSettings) => upsertTable("club_settings", toClubSettings(item));
