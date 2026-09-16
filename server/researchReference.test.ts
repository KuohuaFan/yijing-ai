import { describe, expect, it } from "vitest";
import { researchDatasetReadiness } from "./researchReference";

describe("researchDatasetReadiness", () => {
  it("blocks a statistical dataset without audit, de-identification, and decision-use guardrails", () => {
    const result = researchDatasetReadiness({ sourceName: "示例來源", sampleSize: 30 });
    expect(result.ready).toBe(false);
    expect(result.missing).toContain("去識別化聲明");
    expect(result.missing).toContain("非個人決策用途聲明");
  });

  it("accepts only a complete auditable research manifest", () => {
    const result = researchDatasetReadiness({
      sourceName: "公開研究資料集",
      sourceUrl: "https://example.org/data",
      license: "CC BY 4.0",
      studyPurpose: "描述性研究",
      sampleUnit: "去識別化觀察紀錄",
      sampleSize: 120,
      deidentified: true,
      auditMethod: "版本化資料辭典與抽樣稽核",
      methodologyUrl: "https://example.org/method",
      updatedAt: "2026-08-26",
      decisionUseProhibited: true,
    });
    expect(result).toEqual({ ready: true, missing: [] });
  });
});
