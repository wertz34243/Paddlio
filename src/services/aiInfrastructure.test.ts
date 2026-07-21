import { describe, expect, it, vi, beforeEach } from "vitest";
import { seedData } from "../data/seed";
import { PaddlioAIContextBuilder } from "./aiContextBuilder";
import { createAIInputHash, getAIInvalidationTargets, readAICache, writeAICache } from "./aiCacheService";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      removeItem: vi.fn((key: string) => store.delete(key)),
    },
  });
});

describe("PaddlioAIContextBuilder", () => {
  it("builds compact daily and recovery contexts without loading raw archives", () => {
    const user = seedData.users[0];
    const builder = new PaddlioAIContextBuilder(seedData, user);

    expect(builder.buildDailyCoachContext(seedData.plan[0].date)).toMatchObject({
      userId: user.userId,
      date: seedData.plan[0].date,
    });
    expect(Array.isArray(builder.buildDailyCoachContext(seedData.plan[0].date).todayPlan)).toBe(true);
    expect(builder.buildRecoveryContext(seedData.plan[0].date)).toHaveProperty("hardSessionsLast7Days");
  });
});

describe("AI cache", () => {
  it("creates stable input hashes independent of object key order", () => {
    expect(createAIInputHash({ b: 2, a: 1 })).toBe(createAIInputHash({ a: 1, b: 2 }));
  });

  it("stores and expires cached AI outputs", () => {
    const inputHash = createAIInputHash({ week: "2026-W30" });
    const now = new Date("2026-07-21T10:00:00.000Z");
    writeAICache("weekly_summary", inputHash, { text: "Kurzfassung" }, { now, ttlMinutes: 5 });

    expect(readAICache("weekly_summary", inputHash, "2026-07-21T10:04:00.000Z")?.output).toEqual({ text: "Kurzfassung" });
    expect(readAICache("weekly_summary", inputHash, "2026-07-21T10:06:00.000Z")).toBeNull();
  });

  it("does not invalidate training AI for messages", () => {
    expect(getAIInvalidationTargets("message")).toEqual([]);
    expect(getAIInvalidationTargets("polar")).toContain("recovery_summary");
  });
});
