import { describe, expect, it } from "vitest";
import { calculateBazi, readStoredDaYunConventions } from "./bazi";

describe("八字規則引擎", () => {
  it("以公開的民用時間與日界慣例產生四柱與指定流年", () => {
    const chart = calculateBazi({ year: 1990, month: 6, day: 7, hour: 9, minute: 11, sect: 2, targetYear: 2026 });
    expect(chart.pillars).toHaveLength(4);
    expect(chart.pillars.map((pillar) => pillar.label)).toEqual(["年柱", "月柱", "日柱", "時柱"]);
    expect(chart.dayMaster).toHaveLength(1);
    expect(chart.annual.year).toBe(2026);
    expect(chart.annual.ganZhi).toHaveLength(2);
    expect(chart.conventions.dayBoundary).toBe("子正（00:00）");
  });

  it("將子初與子正日界作為可見、可比較的慣例", () => {
    const input = { year: 1990, month: 6, day: 7, hour: 23, minute: 30, targetYear: 2026 };
    expect(calculateBazi({ ...input, sect: 1 }).conventions.dayBoundary).toBe("子初（23:00）");
    expect(calculateBazi({ ...input, sect: 2 }).conventions.dayBoundary).toBe("子正（00:00）");
  });

  it("僅在使用者明示傳統順逆行參數時產生可檢查的大運時間軸", () => {
    const base = { year: 1981, month: 1, day: 29, hour: 23, minute: 37, sect: 2 as const, targetYear: 1995 };
    expect(calculateBazi(base).daYun).toBeUndefined();
    expect(calculateBazi({ ...base, daYunGender: "female" }).daYun).toBeUndefined();
    expect(calculateBazi({ ...base, daYunSect: 1 }).daYun).toBeUndefined();
    const daYun = calculateBazi({ ...base, daYunGender: "female" as const, daYunSect: 1 as const }).daYun;
    expect(daYun?.direction).toMatch(/順行|逆行/);
    expect(daYun?.start.solarDate).toContain("1989-02-18");
    expect(daYun?.preStart.ganZhi).toBeUndefined();
    expect(daYun?.periods).toHaveLength(8);
    expect(daYun?.periods[0]?.ganZhi).toHaveLength(2);
  });

  it("將起運換算口徑明確標記為分鐘差或時辰差", () => {
    const base = { year: 2022, month: 3, day: 9, hour: 20, minute: 51, sect: 2 as const, targetYear: 2032, daYunGender: "male" as const };
    expect(calculateBazi({ ...base, daYunSect: 2 }).daYun?.conventions.startMethod).toContain("分鐘差");
    expect(calculateBazi({ ...base, daYunSect: 1 }).daYun?.conventions.startMethod).toContain("時辰差");
  });

  it("可從 JSON 保存／重載後的 chartResult 讀回大運慣例版本與口徑", () => {
    const chart = calculateBazi({ year: 1990, month: 1, day: 1, hour: 12, minute: 0, sect: 2, targetYear: 2026, daYunGender: "female", daYunSect: 1 });
    const reloadedChart = JSON.parse(JSON.stringify(chart));
    expect(readStoredDaYunConventions(reloadedChart)).toEqual({ genderParameter: "female", calculationSect: 1, ruleVersion: "lunar-javascript-yun-v1" });
  });

  it("拒絕不存在的公曆日期，避免曆法套件自動正規化錯誤輸入", () => {
    expect(() => calculateBazi({ year: 2023, month: 2, day: 29, hour: 12, minute: 0, sect: 2, targetYear: 2026 })).toThrow("有效的公曆民用時間");
  });
});
