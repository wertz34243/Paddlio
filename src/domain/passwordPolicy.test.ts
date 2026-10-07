import { describe, expect, it } from "vitest";
import { passwordMeetsRequirements } from "./passwordPolicy";

describe("password policy", () => {
  it("accepts passwords that satisfy every release requirement", () => {
    expect(passwordMeetsRequirements("Paddlio!50A")).toBe(true);
  });

  it.each([
    "Kurz!1Aa",
    "paddlio!50a",
    "PADDLIO!50A",
    "PaddlioPass!",
    "Paddlio500A",
  ])("rejects an incomplete password policy shape: %s", (password) => {
    expect(passwordMeetsRequirements(password)).toBe(false);
  });
});
