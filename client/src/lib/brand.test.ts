import { describe, expect, it } from "vitest";
import { BRAND, resolveBrandAssetUrl } from "./brand";

describe("brand logo configuration", () => {
  it("uses the project-managed purple bird logo as the brand source of truth", () => {
    expect(BRAND.logo).toMatch(/^\/manus-storage\/.+\.(png|webp|jpg|jpeg)$/i);
    expect(resolveBrandAssetUrl()).toMatch(
      /^https:\/\/yijingai\.manus\.space\/manus-storage\/.+\.(png|webp|jpg|jpeg)$/i,
    );
  });

  it("serves the configured logo from the lightweight public asset endpoint", async () => {
    const response = await fetch(resolveBrandAssetUrl(), {
      method: "GET",
      signal: AbortSignal.timeout(10_000),
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get("content-type")).toMatch(/^image\//);
  });
});
