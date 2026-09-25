import { describe, expect, it } from "vitest";
import { MAX_PROFILE_IMAGE_BYTES, validateProfileImage } from "./profileImage";

describe("profile image validation", () => {
  it("accepts supported images within the limit", () => {
    expect(validateProfileImage({ type: "image/png", size: MAX_PROFILE_IMAGE_BYTES })).toBe("");
  });

  it("rejects active or ambiguous file types", () => {
    expect(validateProfileImage({ type: "image/svg+xml", size: 100 })).toContain("JPG");
  });

  it("rejects oversized images", () => {
    expect(validateProfileImage({ type: "image/jpeg", size: MAX_PROFILE_IMAGE_BYTES + 1 })).toContain("2 MB");
  });
});
