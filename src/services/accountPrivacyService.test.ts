import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSupabaseClient } from "../lib/supabase";
import { ACCOUNT_DELETION_CONFIRMATION, deleteOwnAccount, downloadPersonalDataExport } from "./accountPrivacyService";

vi.mock("../lib/supabase", () => ({ getSupabaseClient: vi.fn() }));

describe("account privacy service", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseClient).mockReset();
  });

  it("rejects account deletion before any cloud call when confirmation is wrong", async () => {
    await expect(deleteOwnAccount("loeschen", "user-1")).rejects.toThrow("Bestätigung");
    expect(getSupabaseClient).not.toHaveBeenCalled();
  });

  it("sends account deletion with the current account identity", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: { deleted: true }, error: null });
    vi.mocked(getSupabaseClient).mockReturnValue({ functions: { invoke } } as never);

    await deleteOwnAccount(ACCOUNT_DELETION_CONFIRMATION, "user-1");

    expect(invoke).toHaveBeenCalledWith("account-privacy", {
      body: { action: "delete", confirmation: ACCOUNT_DELETION_CONFIRMATION, confirmAccountId: "user-1" },
    });
  });

  it("does not claim an export when the server response has no export payload", async () => {
    const invoke = vi.fn().mockResolvedValue({ data: {}, error: null });
    vi.mocked(getSupabaseClient).mockReturnValue({ functions: { invoke } } as never);
    await expect(downloadPersonalDataExport()).rejects.toThrow("nicht exportiert");
  });
});
