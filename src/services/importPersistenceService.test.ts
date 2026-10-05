import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedData } from "../data/seed";
import type { User } from "../domain/types";

const { upsertTraining, upsertJournal, upsertCompetition, upsertStart, upsertMaterial, upsertGroup, upsertImportedMember } = vi.hoisted(() => ({
  upsertTraining: vi.fn(),
  upsertJournal: vi.fn(),
  upsertCompetition: vi.fn(),
  upsertStart: vi.fn(),
  upsertMaterial: vi.fn(),
  upsertGroup: vi.fn(),
  upsertImportedMember: vi.fn(),
}));

vi.mock("./trainingService", () => ({ upsertCloudTraining: upsertTraining }));
vi.mock("./journalService", () => ({ upsertCloudJournalEntry: upsertJournal }));
vi.mock("./competitionService", () => ({ upsertCloudCompetition: upsertCompetition }));
vi.mock("./competitionStartService", () => ({ upsertCloudCompetitionStartEntry: upsertStart }));
vi.mock("./materialService", () => ({ upsertCloudMaterial: upsertMaterial }));
vi.mock("./coachService", () => ({ upsertCloudTrainingGroup: upsertGroup }));
vi.mock("./importedClubMemberService", () => ({ upsertCloudImportedClubMember: upsertImportedMember }));

import { persistImportedEntities } from "./importPersistenceService";

const user = seedData.users[0] as User;

describe("import persistence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists only newly imported planning rows", async () => {
    const entry = { ...seedData.plan[0], id: "new-plan" };
    const count = await persistImportedEntities("training_plans", seedData, { ...seedData, plan: [entry, ...seedData.plan] }, user);
    expect(count).toBe(1);
    expect(upsertTraining).toHaveBeenCalledOnce();
  });

  it("persists imported sessions through the journal source of truth", async () => {
    const entry = {
      ...seedData.journal[0],
      id: "749cd776-785a-486e-96da-00c58b5c946d",
      trainingId: "3eea80ae-c5fd-4bcb-b1a9-a42a4c6a5311",
      title: "Technik Import",
    };
    const count = await persistImportedEntities(
      "training_sessions",
      { ...seedData, journal: [] },
      { ...seedData, journal: [entry] },
      user,
    );
    expect(count).toBe(1);
    expect(upsertJournal).toHaveBeenCalledWith(entry);
  });

  it("uses the canonical cloud club for imported competition results", async () => {
    const competition = { ...seedData.competitions[0], id: "749cd776-785a-486e-96da-00c58b5c946d", clubId: "Lokaler Vereinsname" };
    const cloudClubId = "78fd4956-3549-4f66-94d0-963c75cf8310";
    const count = await persistImportedEntities(
      "competition_results",
      { ...seedData, competitions: [] },
      { ...seedData, competitions: [competition] },
      user,
      cloudClubId,
    );
    expect(count).toBe(1);
    expect(upsertCompetition).toHaveBeenCalledWith(
      expect.objectContaining({ clubId: cloudClubId }),
      cloudClubId,
    );
  });

  it("persists start-list rows through their dedicated cloud table", async () => {
    const entry = {
      id: "start-1", competitionId: seedData.competitions[0].id, clubId: "", createdBy: user.userId,
      startNumber: 4, displayName: "Fiktive Person", boatClass: "K1" as const,
      ageClass: "U18", source: "file", createdAt: "2026-10-01T10:00:00.000Z", updatedAt: "2026-10-01T10:00:00.000Z",
    };
    const count = await persistImportedEntities("start_lists", seedData, { ...seedData, competitionStartEntries: [entry] }, user);
    expect(count).toBe(1);
    expect(upsertStart).toHaveBeenCalledWith(entry);
  });

  it("persists imported athletes as permission-neutral club candidates", async () => {
    const athlete = {
      id: "749cd776-785a-486e-96da-00c58b5c946d", coachUserId: user.userId,
      clubId: "78fd4956-3549-4f66-94d0-963c75cf8310", firstName: "Fiktive", lastName: "Person",
      email: "fiktiv@example.test", name: "Fiktive Person", birthDate: "2010-05-05", ageClass: "U18" as const,
      club: "Testverein", boatClasses: ["K1" as const], paddleSide: "rechts" as const,
      groupId: "", groupIds: [], goals: "", trainerNotes: "", notes: "", status: "aktiv" as const,
      invitationStatus: "einladung_offen" as const, createdAt: "2026-10-01T10:00:00.000Z", updatedAt: "2026-10-01T10:00:00.000Z",
    };
    const count = await persistImportedEntities(
      "athletes",
      seedData,
      { ...seedData, coachAthletes: [athlete, ...seedData.coachAthletes] },
      user,
      "78fd4956-3549-4f66-94d0-963c75cf8310",
    );
    expect(count).toBe(1);
    expect(upsertImportedMember).toHaveBeenCalledWith(expect.objectContaining({
      id: athlete.id,
      memberKind: "athlete",
      status: "pending",
    }));
  });
});
