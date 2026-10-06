import { describe, expect, it } from "vitest";
import { getPublicAppUrl, getPublicRoute, isPublicWebsiteRequest, publicHref } from "./publicSiteRouting";

describe("public website routing", () => {
  it("separates public hosts from app and development hosts", () => {
    expect(isPublicWebsiteRequest("paddlio.de", "/")).toBe(true);
    expect(isPublicWebsiteRequest("www.paddlio.de", "/installation")).toBe(true);
    expect(isPublicWebsiteRequest("app.paddlio.de", "/")).toBe(false);
    expect(isPublicWebsiteRequest("dev.paddlio.de", "/")).toBe(false);
  });

  it("supports an isolated development preview path", () => {
    expect(isPublicWebsiteRequest("dev.paddlio.de", "/public-preview")).toBe(true);
    expect(getPublicRoute("/public-preview/datenschutz")).toBe("/datenschutz");
    expect(publicHref("/hilfe", true)).toBe("/public-preview/hilfe");
  });

  it("uses the production app domain only from the public production site", () => {
    expect(getPublicAppUrl("paddlio.de")).toBe("https://app.paddlio.de");
    expect(getPublicAppUrl("dev.paddlio.de")).toBe("https://dev.paddlio.de");
    expect(getPublicAppUrl("paddlio.de", "https://preview.example")).toBe("https://preview.example");
  });
});
