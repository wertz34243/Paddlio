import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { describe, expect, it, vi } from "vitest";

// Execute the real handler with fake Supabase clients; no live data is deleted.
const source = readFileSync("supabase/functions/account-privacy/index.ts", "utf8")
  .replace(/^import .*;\r?\n/, "");
const compiled = ts.transpile(source, { target: ts.ScriptTarget.ES2022 });
const userId = "00000000-0000-4000-8000-000000000001";

function handler({ authenticated = true, ready = true, readyError = null, deleteError = null } = {}) {
  let serve;
  const deleteUser = vi.fn(async () => ({ error: deleteError }));
  const rpc = vi.fn(async () => ({ data: ready, error: readyError }));
  const from = vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { roles: ["Athlete"], status: "active" } }) }) }),
  }));
  const userClient = { auth: { getUser: async () => ({
    data: { user: authenticated ? { id: userId } : null },
    error: authenticated ? null : { message: "bad token" },
  }) } };
  const admin = { from, rpc, auth: { admin: { deleteUser } } };
  let clients = 0;
  runInNewContext(compiled, {
    Deno: {
      env: { get: (key) => ({
        SUPABASE_URL: "https://nlllqsfdhfiwticrcrnp.supabase.co",
        SUPABASE_ANON_KEY: "test-public",
        SUPABASE_SERVICE_ROLE_KEY: "test-private",
      })[key] },
      serve: (callback) => { serve = callback; },
    },
    createClient: () => clients++ === 0 ? userClient : admin,
    Response, console: { error: vi.fn() },
  });
  const invoke = (overrides = {}, origin = "https://dev.paddlio.de", token = true) => serve(new Request("https://test.invalid", {
    method: "POST",
    headers: { Origin: origin, ...(token ? { Authorization: "Bearer test" } : {}) },
    body: JSON.stringify({ action: "delete", confirmation: "KONTO ENDGUELTIG LOESCHEN", confirmAccountId: userId, ...overrides }),
  }));
  return { invoke, deleteUser, rpc, from };
}

describe("account privacy deletion boundary", () => {
  it("rejects missing or invalid authentication without deleting", async () => {
    const missing = handler();
    expect((await missing.invoke({}, undefined, false)).status).toBe(401);
    expect(missing.deleteUser).not.toHaveBeenCalled();
    const invalid = handler({ authenticated: false });
    expect((await invalid.invoke()).status).toBe(401);
    expect(invalid.deleteUser).not.toHaveBeenCalled();
  });
  it("rejects foreign origins", async () => {
    const h = handler();
    expect((await h.invoke({}, "https://untrusted.invalid")).status).toBe(403);
    expect(h.deleteUser).not.toHaveBeenCalled();
  });
  it.each([{ confirmation: "wrong" }, { confirmAccountId: "another-account" }])("requires exact own-account confirmation: %j", async (payload) => {
    const h = handler();
    expect((await h.invoke(payload)).status).toBe(400);
    expect(h.rpc).not.toHaveBeenCalled();
    expect(h.deleteUser).not.toHaveBeenCalled();
  });
  it.each([{ ready: false }, { ready: null }, { readyError: { code: "42883" } }])("fails closed without the installed cleanup trigger: %j", async (options) => {
    const h = handler(options);
    expect((await h.invoke()).status).toBe(503);
    expect(h.deleteUser).not.toHaveBeenCalled();
  });
  it("deletes only the verified account through Auth", async () => {
    const h = handler();
    const result = await h.invoke();
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ deleted: true });
    expect(h.deleteUser).toHaveBeenCalledExactlyOnceWith(userId);
    expect(h.from.mock.calls).toEqual([["profiles"]]);
    expect(result.headers.get("cache-control")).toBe("no-store");
  });
  it("reports an Auth failure without claiming success or exposing internal details", async () => {
    const h = handler({ deleteError: { code: "database_error", message: "private internals" } });
    const result = await h.invoke();
    expect(result.status).toBe(500);
    expect(await result.json()).toEqual({ error: "delete_failed" });
  });
});
