import { describe, expect, it } from "vitest";
import { calculateBazi } from "./bazi";
import { BAZI_GUIDE_HEADINGS, fallbackBaziGuide, isBaziHighRiskQuestion } from "./baziGuide";

describe("八字研究解說安全規則", () => {
  const chart = calculateBazi({ year: 1968, month: 10, day: 14, hour: 23, minute: 40, sect: 1, targetYear: 2026 });

  it("produces all six deterministic research headings without predictions", () => {
    const content = fallbackBaziGuide(chart, "請比較盤面結構");
    BAZI_GUIDE_HEADINGS.forEach((heading) => expect(content).toContain(heading));
    expect(content).toContain("不是吉凶、事件、醫療、法律、投資");
  });

  it("redirects high-risk prediction requests", () => {
    expect(isBaziHighRiskQuestion("我今年會不會破財？")).toBe(true);
    expect(isBaziHighRiskQuestion("請預測我的投資報酬")).toBe(true);
    expect(isBaziHighRiskQuestion("請比較日主與月令的結構")).toBe(false);
  });
});
