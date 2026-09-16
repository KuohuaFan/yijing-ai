import { describe, expect, it } from "vitest";
import { createBaziMarginalia } from "./baziCommentary";

const chart = {
  pillars: [{ label: "年柱", value: "戊申" }, { label: "月柱", value: "壬戌" }, { label: "日柱", value: "戊午" }, { label: "時柱", value: "壬子" }],
  dayMaster: "戊",
  dayMasterElement: "土",
  hiddenStems: { year: "庚壬戊", month: "辛丁戊", day: "丁己", hour: "癸" },
  tenGods: { year: "比肩", month: "偏財", day: "日主", hour: "偏財" },
  elementCounts: { 土: 2, 水: 2 },
  annual: { year: 2026, ganZhi: "丙午", reference: "以立春為年柱界，月份採節氣月。" },
  conventions: { dayBoundary: "子初（23:00）", timezoneNotice: "本 MVP 以使用者輸入的民用時間計算，尚未套用真太陽時校正。" },
};

describe("createBaziMarginalia", () => {
  it("produces six non-predictive notes grounded in chart fields", () => {
    const notes = createBaziMarginalia(chart);
    expect(notes).toHaveLength(6);
    expect(notes[0].observation).toContain("戊");
    expect(notes[2].observation).toContain("木0、火0、土2、金0、水2");
    expect(notes[4].observation).toContain("2026");
    expect(notes.map((note) => note.observation).join(" ")).not.toContain("必然");
  });
});
