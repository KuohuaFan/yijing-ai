import { describe, expect, it } from "vitest";
import { calculateBazi } from "./bazi";
import { BAZI_GUIDE_HEADINGS, createBaziResearchGuide, fallbackBaziGuide, isBaziHighRiskQuestion } from "./baziGuide";

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
    expect(isBaziHighRiskQuestion("這個病今年會不會惡化？")).toBe(true);
    expect(isBaziHighRiskQuestion("訴訟是否會勝訴？")).toBe(true);
    expect(isBaziHighRiskQuestion("請比較日主與月令的結構")).toBe(false);
  });

  it("高風險轉向仍維持六段可讀格式且不輸出事件預測", async () => {
    const result = await createBaziResearchGuide({ year: 1968, month: 10, day: 14, hour: 23, minute: 40, sect: 1, targetYear: 2026 }, "我的投資會不會賺錢？");
    expect(result.kind).toBe("safety_redirect");
    BAZI_GUIDE_HEADINGS.forEach((heading) => expect(result.content).toContain(heading));
    expect(result.content).toContain("不提供某年會發生何事");
  });
});
