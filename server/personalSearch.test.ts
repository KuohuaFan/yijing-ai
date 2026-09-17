import { describe, expect, it } from "vitest";
import { buildPersonalSearchHits } from "./personalSearch";

const date = (day: number) => new Date(`2026-09-${String(day).padStart(2, "0")}T00:00:00Z`);

describe("私人研讀統一搜尋權限", () => {
  it("只回傳本人的起卦與反思，並提供可跳轉錨點", () => {
    const hits = buildPersonalSearchHits({
      userId: 7,
      query: "潛龍",
      divinations: [
        { id: 1, userId: 7, question: "如何理解潛龍勿用？", originalHexagramId: 1, transformedHexagramId: 1, createdAt: date(1) },
        { id: 2, userId: 8, question: "潛龍他人資料", originalHexagramId: 1, transformedHexagramId: 2, createdAt: date(2) },
      ],
      reflections: [
        { id: 3, userId: 7, title: "潛龍反思", body: "回到爻辭核對", anchor: "hexagram-1-lines", updatedAt: date(3) },
        { id: 4, userId: 8, title: "他人反思", body: "潛龍", anchor: null, updatedAt: date(4) },
      ],
      annotations: [],
    });
    expect(hits.map((hit) => hit.href)).toEqual(["/reader/1#hexagram-1-lines", "/shelf#divination-1"]);
    expect(hits.every((hit) => hit.visibility === "private")).toBe(true);
  });

  it("隱藏他人私人註解，但保留本人私人與他人共享註解", () => {
    const hits = buildPersonalSearchHits({
      userId: 7,
      query: "校讀",
      divinations: [],
      reflections: [],
      annotations: [
        { id: 1, userId: 7, commentator: "本人", versionLabel: "校讀甲", body: "校讀私註", anchor: "hexagram-1-judgment", visibility: "private", updatedAt: date(1) },
        { id: 2, userId: 8, commentator: "他人", versionLabel: "校讀乙", body: "校讀私註", anchor: "hexagram-2-judgment", visibility: "private", updatedAt: date(2) },
        { id: 3, userId: 8, commentator: "共享者", versionLabel: "校讀丙", body: "校讀共享", anchor: "hexagram-3-judgment", visibility: "shared", updatedAt: date(3) },
      ],
    });
    expect(hits).toHaveLength(2);
    expect(hits.map((hit) => [hit.title, hit.visibility])).toEqual([["共享者・校讀丙", "shared"], ["本人・校讀甲", "private"]]);
  });
});
