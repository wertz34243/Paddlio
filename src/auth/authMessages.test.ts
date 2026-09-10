import { describe, expect, it } from "vitest";
import { isUserVisibleLoginMessage, PROFILE_SYNC_RETRY_MESSAGE } from "./authMessages";

describe("auth login messages", () => {
  it("keeps email confirmation visible on the login screen", () => {
    expect(isUserVisibleLoginMessage("E-Mail-Adresse bestätigt. Du kannst dich jetzt anmelden.")).toBe(true);
  });

  it("keeps the neutral login prompt visible", () => {
    expect(isUserVisibleLoginMessage("Bitte melde dich mit deinem Paddlio Cloud-Konto an.")).toBe(true);
  });

  it("hides technical profile sync fallback warnings from the login screen", () => {
    expect(
      isUserVisibleLoginMessage(
        "Cloud eingeschränkt: Profil konnte nicht bestätigt werden. Die Rolle ist lokal abgeleitet und wird beim nächsten erfolgreichen Profil-Sync überschrieben.",
      ),
    ).toBe(false);
  });

  it("hides internal provider and RLS details from the login screen", () => {
    expect(isUserVisibleLoginMessage("Supabase: new row violates row-level security policy for table profiles")).toBe(false);
    expect(isUserVisibleLoginMessage(PROFILE_SYNC_RETRY_MESSAGE)).toBe(false);
  });
});
