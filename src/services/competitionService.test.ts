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
});
