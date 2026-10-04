import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabaseClient } from "../lib/supabase";
import type { MaterialItem, SeasonGoal } from "../domain/types";
import { fromCloudGoal, upsertCloudGoal } from "./goalService";
import { upsertCloudMaterial } from "./materialService";
import { updateCloudProfile, updateCloudProfileConfirmed } from "./profileService";

vi.mock("../lib/supabase", () => ({ getSupabaseClient: vi.fn() }));

const USER_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ENTITY_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const createClient = () => {
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const maybeSingle = vi.fn().mockResolvedValue({
    data: {
      id: USER_ID,
      email: "dev.athlete@paddlio.test",
      first_name: "Dev",
      last_name: "Athlete",
      display_name: "Dev Athlete",
      club_id: null,
      roles: ["Athlete"],
      status: "active",
      avatar_url: null,
      age_category: null,
      boat_classes: ["K1"],
      paddle_side: null,
      profile_data: {},
      created_at: "2026-10-03T08:00:00.000Z",
      updated_at: "2026-10-03T08:00:00.000Z",
    },
    error: null,
  });
  const select = vi.fn(() => ({ maybeSingle }));
  const eq = vi.fn(() => ({ select }));
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ upsert, update }));
  return { client: { from }, from, upsert, update, eq, select, maybeSingle };
};

beforeEach(() => {
  vi.stubGlobal("navigator", { onLine: true });
  vi.mocked(getSupabaseClient).mockReset();
});

describe("reliable personal persistence", () => {
  it("round-trips every editable goal field and confirms the cloud write", async () => {
    const { client, upsert } = createClient();
    vi.mocked(getSupabaseClient).mockReturnValue(client as never);
    const goal: SeasonGoal = {
      id: ENTITY_ID,
      athleteId: USER_ID,
      ownerUserId: USER_ID,
      assignedByUserId: USER_ID,
      title: "Technikziel",
      description: "Linie stabilisieren",
      category: "technical",
      metric: "manual",
      direction: "over",
      targetValue: 8,
      unit: "Punkte",
      startDate: "2026-10-03",
      dueDate: "2026-12-31",
      status: "active",
      priority: "high",
      currentValueOverride: 4,
      coachNote: "Ruhig bleiben",
      athleteNote: "Video prüfen",
      createdAt: "2026-10-03T08:00:00.000Z",
      updatedAt: "2026-10-03T08:00:00.000Z",
    };

    await expect(upsertCloudGoal(goal)).resolves.toBe("synced");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      athlete_id: USER_ID,
      assigned_by: USER_ID,
      category: "technical",
      metric: "manual",
      direction: "over",
      priority: "high",
      start_date: "2026-10-03",
      coach_note: "Ruhig bleiben",
      athlete_note: "Video prüfen",
    }), { onConflict: "id" });

    expect(fromCloudGoal({
      id: ENTITY_ID,
      athlete_id: USER_ID,
      owner_user_id: USER_ID,
      assigned_by: USER_ID,
      title: goal.title,
      description: goal.description,
      category: goal.category,
      metric: goal.metric,
      direction: goal.direction,
      target_value: goal.targetValue,
      current_value: goal.currentValueOverride,
      unit: goal.unit,
      start_date: goal.startDate,
      due_date: goal.dueDate,
      status: goal.status,
      priority: goal.priority,
      coach_note: goal.coachNote,
      athlete_note: goal.athleteNote,
      created_at: goal.createdAt,
      updated_at: goal.updatedAt,
    })).toMatchObject(goal);
  });

  it("writes personal material with the authenticated account assignment", async () => {
    const { client, upsert } = createClient();
    vi.mocked(getSupabaseClient).mockReturnValue(client as never);
    const item: MaterialItem = {
      id: ENTITY_ID,
      athleteId: USER_ID,
      category: "Boot",
      name: "K1 Testboot",
      weightKg: 9,
      lengthCm: 350,
      imageDataUrl: "",
      status: "bereit",
      rating: 9,
      note: "Persönliches Material",
      createdAt: "2026-10-03T08:00:00.000Z",
      updatedAt: "2026-10-03T08:00:00.000Z",
    };

    await expect(upsertCloudMaterial(item)).resolves.toBe("synced");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ athlete_id: USER_ID, name: "K1 Testboot" }), { onConflict: "id" });
  });

  it("persists extended profile fields instead of silently dropping profile_data", async () => {
    const { client, update, eq } = createClient();
    vi.mocked(getSupabaseClient).mockReturnValue(client as never);
    const profileData = {
      trainingYears: 5,
      competitionExperience: "National",
      longTermGoal: "Finale",
      seasonGoal: "Konstanz",
      personalNotes: "Links paddeln",
      language: "de",
      measurementUnit: "metrisch",
    };

    await expect(updateCloudProfile({
      id: USER_ID,
      first_name: "Dev",
      last_name: "Athlete",
      profile_data: profileData,
    })).resolves.toBe("synced");
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ profile_data: profileData }));
    expect(eq).toHaveBeenCalledWith("id", USER_ID);
  });

  it("does not report success when RLS updates no profile row", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const select = vi.fn(() => ({ maybeSingle }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    vi.mocked(getSupabaseClient).mockReturnValue({ from: vi.fn(() => ({ update })) } as never);

    await expect(updateCloudProfileConfirmed({ id: USER_ID, first_name: "Nicht bestätigt" }))
      .rejects.toThrow("profile_update_not_confirmed");
  });
});
