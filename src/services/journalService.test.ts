import { beforeEach, describe, expect, it, vi } from "vitest";

const { runCloudWrite } = vi.hoisted(() => ({
  runCloudWrite: vi.fn(async (..._args: unknown[]) => undefined),
}));

vi.mock("./cloudWriteService", () => ({ runCloudWrite }));
vi.mock("../lib/supabase", () => ({ getSupabaseClient: () => null }));
vi.mock("./cloudIds", () => ({
  sanitizeCloudPayload: (value: Record<string, unknown>) => value,
  toCloudUuid: (value: string) => value,
}));

import { fromCloudJournalEntry, upsertCloudJournalEntry } from "./journalService";

describe("journal cloud persistence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists imported display metadata for cross-device rendering", async () => {
    await upsertCloudJournalEntry({
      id: "749cd776-785a-486e-96da-00c58b5c946d",
      athleteId: "a1e53085-b184-4893-bac1-e09db356ddd5",
      trainingId: "749cd776-785a-486e-96da-00c58b5c946d",
      title: "Technik Import",
      trainingType: "Technik",
      boatClass: "K1",
      date: "2026-10-05",
      completionStatus: "completed",
      actualDurationMinutes: 75,
      trainingRating: 7,
      feeling: 7,
      fatigue: 4,
      sleep: 7,
      motivation: 7,
      notes: "",
      createdAt: "2026-10-05T10:00:00.000Z",
      updatedAt: "2026-10-05T10:00:00.000Z",
    });

    expect(runCloudWrite).toHaveBeenCalledWith(
      "training_journal_entries",
      "upsert",
      expect.objectContaining({
        title: "Technik Import",
        training_type: "Technik",
        boat_class: "K1",
      }),
      expect.any(Function),
    );
  });

  it("restores imported display metadata after a cloud reload", () => {
    expect(fromCloudJournalEntry({
      id: "749cd776-785a-486e-96da-00c58b5c946d",
      athlete_id: "a1e53085-b184-4893-bac1-e09db356ddd5",
      training_id: "749cd776-785a-486e-96da-00c58b5c946d",
      training_plan_entry_id: null,
      title: "Technik Import",
      training_type: "Technik",
      boat_class: "K1",
      date: "2026-10-05",
      completion_status: "completed",
      actual_duration_minutes: 75,
      training_rating: 7,
      feeling: 7,
      fatigue: 4,
      sleep: 7,
      motivation: 7,
      notes: "Importierte Einheit",
      created_at: "2026-10-05T10:00:00.000Z",
      updated_at: "2026-10-05T10:00:00.000Z",
    })).toMatchObject({
      title: "Technik Import",
      trainingType: "Technik",
      boatClass: "K1",
      trainingPlanEntryId: undefined,
      actualDurationMinutes: 75,
    });
  });
});
