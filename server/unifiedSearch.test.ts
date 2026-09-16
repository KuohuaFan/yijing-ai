import { describe, expect, it } from "vitest";
import { searchCanonicalYijing } from "./unifiedSearch";

describe("公開原典統一搜尋", () => {
  it("回傳帶來源、版本、錨點與 Reader 跳轉的卦辭命中", () => {
    const hit = searchCanonicalYijing("潛龍勿用").find((item) => item.kind === "hexagram");
    expect(hit).toMatchObject({ title: "乾・第 1 卦", anchor: "hexagram-1-lines", href: "/reader/1#hexagram-1-lines", visibility: "public" });
    expect(hit?.sourceLabel).toContain("Project Gutenberg");
    expect(hit?.versionLabel).toContain("2021");
  });

  it("搜尋不足兩字不建立廣泛索引結果", () => {
    expect(searchCanonicalYijing("乾")).toEqual([]);
  });
});
