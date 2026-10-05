import { beforeEach, describe, expect, it, vi } from "vitest";
import { seedData } from "../data/seed";

const { runCloudWrite, upsertPersonalBest } = vi.hoisted(() => ({
  runCloudWrite: vi.fn(async (..._args: unknown[]) => undefined),
  upsertPersonalBest: vi.fn(async () => undefined),
}));

vi.mock("./cloudWriteService", () => ({ runCloudWrite }));
vi.mock("./resultsReadinessService", () => ({
  calculatePersonalBests: () => [],
  upsertCloudPersonalBest: upsertPersonalBest,
}));
vi.mock("../lib/supabase", () => ({ getSupabaseClient: () => ({}) }));
vi.mock("./cloudIds", () => ({
  sanitizeCloudPayload: (value: Record<string, unknown>) => value,
  toCloudUuid: (value: string) => value,
  toCloudUuidOrNull: (value?: string | null) => value || null,
}));

import { upsertCloudCompetition } from "./competitionService";

describe("competition cloud persistence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes only the current DEV competition-result columns", async () => {
    await upsertCloudCompetition({ ...seedData.competitions[0], starterField: 24 });
    const resultWrite = runCloudWrite.mock.calls.find((call) => call[0] === "competition_results");
    expect(resultWrite?.[2]).toMatchObject({ starter_count: 24 });
    expect(resultWrite?.[2]).not.toHaveProperty("starter_field");
  });

  it("uses the competition UUID as stable result identity", async () => {
    const id = "749cd776-785a-486e-96da-00c58b5c946d";
    await upsertCloudCompetition({ ...seedData.competitions[0], id });
    const resultWrite = runCloudWrite.mock.calls.find((call) => call[0] === "competition_results");
    expect(resultWrite?.[2]).toMatchObject({ id, competition_id: id });
  });

  it("does not treat an empty first run as the best result", async () => {
    await upsertCloudCompetition({
      ...seedData.competitions[0],
      run1TimeSeconds: 0,
      run1PenaltySeconds: 0,
      run2TimeSeconds: 94.2,
      run2PenaltySeconds: 4,
    });
    const resultWrite = runCloudWrite.mock.calls.find((call) => call[0] === "competition_results");
    expect(resultWrite?.[2]).toMatchObject({ best_total: 98.2, best_total_seconds: 98.2 });
  });
});
