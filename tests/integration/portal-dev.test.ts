import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { expect, it, vi } from "vitest";
import { getSupabaseClient } from "../../src/lib/supabase";
import * as portal from "../../src/services/clubPortalService";
import * as beta from "../../src/services/betaService";

vi.mock("../../src/lib/supabase", () => ({ getSupabaseClient: vi.fn() }));

it.skipIf(process.env.PADDLIO_RUN_DEV_CONTRACT !== "1")("round-trips portal forms against DEV and enforces role boundaries", async () => {
  const env = { ...parseEnv(readFileSync(".env.local", "utf8")), ...parseEnv(readFileSync(".env.e2e.local", "utf8")) };
  const url = "https://nlllqsfdhfiwticrcrnp.supabase.co";
  if (env.VITE_SUPABASE_URL !== url) throw new Error("Exact DEV URL required");
  vi.stubGlobal("navigator", { onLine: true });
  const clients: Record<string, any> = {};
  const users: Record<string, string> = {};
  const fixtures: Array<[string, string]> = [];
  const safe = (result: any, label: string) => {
    if (result.error) throw new Error(`${label}: ${result.error.code ?? "failed"}`);
    return result.data;
  };
  let oldSettings: any; let settingsId = ""; let settingsTouched = false;
  try {
    for (const role of ["ADMIN", "CLUBADMIN", "COACH", "ATHLETE"]) {
      const client = createClient(url, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
      clients[role] = client;
      const login = await client.auth.signInWithPassword({ email: env[`PADDLIO_E2E_${role}_EMAIL`], password: env[`PADDLIO_E2E_${role}_PASSWORD`] });
      if (login.error || !login.data.user) throw new Error(`${role} login failed`);
      users[role] = login.data.user.id;
    }
    const clubId = safe(await clients.CLUBADMIN.from("profiles").select("club_id").eq("id", users.CLUBADMIN).single(), "club lookup").club_id;
    if (!clubId) throw new Error("Test club missing");
    const stamp = new Date().toISOString();
    const common = { clubId, createdAt: stamp, updatedAt: stamp };
    const cases: Array<[string, any, any, any]> = [
      ["club_material", portal.upsertCloudClubMaterial, portal.listCloudClubMaterial, { inventoryNumber: "release-test", category: "Paddel", name: "Contract fixture", condition: "bereit", ownerUserId: "", ownerName: "Fixture", photoUrl: "", lastInspectionDate: "2026-10-23", remark: "Remark", status: "active" }],
      ["boats", portal.upsertCloudClubBoat, portal.listCloudClubBoats, { manufacturer: "Fixture", model: "K1", boatClass: "K1", lengthCm: 520, weightKg: 12, buildYear: 2026, ownerUserId: "", ownerName: "Fixture", isClubBoat: true, linkedAthleteIds: [users.ATHLETE], status: "active" }],
      ["club_events", portal.upsertCloudClubEvent, portal.listCloudClubEvents, { title: "Contract fixture", date: "2026-10-23", time: "12:30", category: "meeting", groupId: "", trainerUserId: users.COACH, athleteUserId: users.ATHLETE, note: "Note" }],
      ["club_documents", portal.upsertCloudClubDocument, portal.listCloudClubDocuments, { folder: "Trainer", title: "Contract fixture", fileName: "fixture.pdf", fileUrl: "https://example.invalid/fixture.pdf", mimeType: "application/pdf", visibleForRoles: ["coach"], uploadedByUserId: users.CLUBADMIN }],
      ["club_messages", portal.upsertCloudClubMessage, portal.listCloudClubMessages, { senderUserId: users.CLUBADMIN, audience: "athlete", groupId: "", recipientUserId: users.ATHLETE, title: "Contract fixture", body: "Private fixture" }],
      ["beta_feedback", beta.upsertCloudBetaFeedback, beta.listCloudBetaFeedback, { userId: users.CLUBADMIN, userRole: "clubAdmin", appVersion: "5.0.0", category: "Fehler", priority: "normal", title: "Contract fixture", description: "Feedback body", pagePath: "/feedback", deviceInfo: "Fixture", browserInfo: "Test", status: "open", adminNote: "", deletedAt: "" }],
      ["beta_testers", beta.upsertCloudBetaTester, beta.listCloudBetaTesters, { userId: users.CLUBADMIN, testerRole: "clubAdmin", status: "active", invitedAt: stamp, lastSeenAt: stamp, notes: "Contract fixture" }],
    ];
    for (const [table, write, read, fields] of cases) {
      vi.mocked(getSupabaseClient).mockReturnValue(clients[table === "beta_testers" ? "ADMIN" : "CLUBADMIN"]);
      const item = { ...common, ...fields, id: randomUUID() };
      fixtures.push([table, item.id]);
      await write(item);
      const saved = (await read()).find((row: any) => row.id === item.id);
      for (const key of ["invitedAt", "lastSeenAt"]) {
        if (saved?.[key]) saved[key] = new Date(saved[key]).toISOString();
      }
      expect(saved, `${table} round-trip`).toMatchObject({ ...fields, clubId, id: item.id });
    }
    const messageId = fixtures.find(([table]) => table === "club_messages")![1];
    expect(safe(await clients.COACH.from("club_messages").select("id").eq("id", messageId), "unaddressed coach read")).toHaveLength(0);
    expect(safe(await clients.ATHLETE.from("club_messages").select("id").eq("id", messageId), "recipient read")).toHaveLength(1);
    const docId = fixtures.find(([table]) => table === "club_documents")![1];
    expect(safe(await clients.COACH.from("club_documents").select("id").eq("id", docId), "selected coach read")).toHaveLength(1);
    safe(await clients.CLUBADMIN.from("club_documents").update({ visible_for_roles: ["teamAdmin"] }).eq("id", docId), "restrict document");
    expect(safe(await clients.COACH.from("club_documents").select("id").eq("id", docId), "excluded coach read")).toHaveLength(0);
    settingsId = clubId;
    oldSettings = safe(await clients.ADMIN.from("club_settings").select("*").eq("id", settingsId).maybeSingle(), "save settings backup");
    vi.mocked(getSupabaseClient).mockReturnValue(clients.CLUBADMIN);
    const settings = { clubId, logoUrl: "", primaryColor: "#123456", secondaryColor: "#654321", address: "Fixture", homepage: "https://example.invalid", contactName: "Fixture", contactEmail: "fixture@example.invalid", clubNumber: "test", imprint: "Fixture", updatedAt: stamp };
    settingsTouched = true;
    await portal.upsertCloudClubSettings(settings);
    await portal.upsertCloudClubSettings({ ...settings, address: "Updated fixture" });
    expect((await portal.listCloudClubSettings()).find(row => row.clubId === clubId)).toMatchObject({ ...settings, address: "Updated fixture", updatedAt: expect.any(String) });
  } finally {
    if (clients.ADMIN && users.ADMIN) {
      for (const [table, id] of fixtures.reverse()) safe(await clients.ADMIN.from(table).delete().eq("id", id), `${table} cleanup`);
      if (settingsTouched) safe(oldSettings ? await clients.ADMIN.from("club_settings").upsert(oldSettings) : await clients.ADMIN.from("club_settings").delete().eq("id", settingsId), "settings restoration");
    }
    for (const client of Object.values(clients)) await client.auth.signOut({ scope: "local" });
    vi.unstubAllGlobals();
  }
}, 120_000);
